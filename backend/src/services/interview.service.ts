import { v4 as uuidv4 } from "uuid";
import User from "../models/user.model";
import type { ISessionStore } from "../session/ISessionStore";
import type {
  SessionState,
  StartResponse,
  AnswerResponse,
  FeedbackResponse,
  PerQuestionFeedback,
} from "../types/index";
import { AIProvider } from "../types/index";
// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  TOTAL_QUESTIONS: 5,
  MAX_FOLLOW_UPS_PER_QUESTION: 2,
  FOLLOW_UP_SCORE_THRESHOLD: 6,
  SESSION_TTL_MS: 60 * 60 * 1000,
} as const;

// ─── AI Provider Interface ────────────────────────────────────────────────────

// ─── State Machine ────────────────────────────────────────────────────────────

export class InterviewStateMachine {
  constructor(
    private store: ISessionStore,
    private ai: AIProvider,
  ) {}

  async start(
    topic: string,
    interviewContext: string,
    difficulty: SessionState["difficulty"] = "medium",
  ): Promise<StartResponse> {
    const sessionId = uuidv4();

    const [intro, questions, diagramSummary] = await Promise.all([
      this.ai.generateIntro(topic, difficulty, interviewContext),
      this.ai.generateQuestions(
        topic,
        difficulty,
        interviewContext,
        CONFIG.TOTAL_QUESTIONS,
      ),
      this.ai.summarizeDiagram(interviewContext).catch((err) => {
        console.error("Failed to generate diagram summary:", err);
        return "";
      }),
    ]);

    const state: SessionState = {
      sessionId,
      topic,
      difficulty,
      interviewContext,
      diagramSummary,
      phase: "ASK_QUESTION",
      questions,
      currentQuestionIndex: 0,
      followUpCount: 0,
      history: [],
      currentRecord: {
        questionIndex: 0,
        question: questions[0],
        answer: "",
        followUps: [],
        evaluation: null,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.store.set(sessionId, state);

    return {
      sessionId,
      intro,
      question: questions[0],
      questionNumber: 1,
      totalQuestions: CONFIG.TOTAL_QUESTIONS,
    };
  }

  // ── /answer ────────────────────────────────────────────────────────────────

  async answer(sessionId: string, answer: string): Promise<AnswerResponse> {
    const state = await this.loadSession(sessionId);
    this.assertPhase(state, ["ASK_QUESTION", "FOLLOW_UP_QUESTION"]);

    const record = state.currentRecord!;

    if (state.phase === "ASK_QUESTION") {
      record.answer = answer;
    } else {
      record.followUps.push({
        question: record.evaluation!.followUpQuestion!,
        answer,
      });
    }

    // Evaluate inline — not a phase, just an async call
    const evaluation = await this.ai.evaluateAnswer(
      record.question,
      record.answer,
      record.followUps,
      state.topic,
      state.interviewContext,
      state.diagramSummary,
    );
    record.evaluation = evaluation;

    // Follow-up decision — just an if statement
    const shouldFollowUp =
      evaluation.needsFollowUp &&
      evaluation.followUpQuestion !== null &&
      state.followUpCount < CONFIG.MAX_FOLLOW_UPS_PER_QUESTION &&
      evaluation.score <= CONFIG.FOLLOW_UP_SCORE_THRESHOLD;

    let response: AnswerResponse;
    if (shouldFollowUp) {
      state.phase = "FOLLOW_UP_QUESTION";
      state.followUpCount += 1;
      await this.saveSession(state);

      response = {
        type: "follow_up",
        question: evaluation.followUpQuestion!,
        questionNumber: state.currentQuestionIndex + 1,
        totalQuestions: CONFIG.TOTAL_QUESTIONS,
        isFinal: false,
      };
    } else {
      response = await this.advance(state);
    }

    return response;
  }

  // ── /feedback ──────────────────────────────────────────────────────────────

  async getFeedback(
    userId: string,
    sessionId: string,
  ): Promise<FeedbackResponse> {
    const state = await this.loadSession(sessionId);

    if (state.phase !== "END") {
      throw new InterviewError("Interview not completed yet", 400);
    }

    const { summary, strengths, improvements } = await this.ai.generateReport(
      state.topic,
      state.interviewContext,
      state.history,
    );

    const perQuestion: PerQuestionFeedback[] = state.history.map((record) => ({
      questionIndex: record.questionIndex,
      question: record.question,
      score: record.evaluation?.score ?? 0,
      followUpCount: record.followUps.length,
      strengths: record.evaluation?.strengths ?? [],
      gaps: record.evaluation?.gaps ?? [],
    }));

    const overallScore =
      perQuestion.reduce((sum, q) => sum + q.score, 0) / perQuestion.length;

    const feedback: FeedbackResponse = {
      overallScore: Math.round(overallScore * 10) / 10,
      totalQuestions: state.history.length,
      perQuestion,
      summary,
      strengths,
      improvements,
    };

    await this.saveFeedback(userId, state, feedback);

    return feedback;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async advance(state: SessionState): Promise<AnswerResponse> {
    state.history.push(state.currentRecord!);

    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex >= CONFIG.TOTAL_QUESTIONS) {
      state.phase = "END";
      state.currentRecord = null;
      await this.saveSession(state);

      return {
        type: "end",
        question: null,
        questionNumber: null,
        totalQuestions: CONFIG.TOTAL_QUESTIONS,
        isFinal: true,
      };
    }

    state.phase = "ASK_QUESTION";
    state.currentQuestionIndex = nextIndex;
    state.followUpCount = 0;
    state.currentRecord = {
      questionIndex: nextIndex,
      question: state.questions[nextIndex],
      answer: "",
      followUps: [],
      evaluation: null,
    };

    await this.saveSession(state);

    return {
      type: "question",
      question: state.questions[nextIndex],
      questionNumber: nextIndex + 1,
      totalQuestions: CONFIG.TOTAL_QUESTIONS,
      isFinal: false,
    };
  }

  async getSessionState(sessionId: string): Promise<SessionState> {
    return this.loadSession(sessionId);
  }

  private async loadSession(sessionId: string): Promise<SessionState> {
    const state = await this.store.get(sessionId);
    if (!state) throw new InterviewError("Session not found", 404);

    if (Date.now() - state.createdAt > CONFIG.SESSION_TTL_MS) {
      await this.store.delete(sessionId);
      throw new InterviewError("Session expired", 410);
    }

    return state;
  }

  private async saveSession(state: SessionState): Promise<void> {
    state.updatedAt = Date.now();
    await this.store.set(state.sessionId, state);
  }

  private async saveFeedback(
    userId: string,
    state: SessionState,
    feedback: FeedbackResponse,
  ): Promise<void> {
    await User.updateOne(
      {
        _id: userId,
        "feedbackHistory.sessionId": { $ne: state.sessionId },
      },
      {
        $push: {
          feedbackHistory: {
            sessionId: state.sessionId,
            topic: state.topic,
            difficulty: state.difficulty,
            interviewContext: state.interviewContext,
            overallScore: feedback.overallScore,
            totalQuestions: feedback.totalQuestions,
            perQuestion: feedback.perQuestion,
            summary: feedback.summary,
            strengths: feedback.strengths,
            improvements: feedback.improvements,
            history: state.history,
            createdAt: new Date(),
          },
        },
      },
    );
  }

  async generateSpeechStream(
    text: string,
    onChunk: (chunk: Buffer) => void,
  ): Promise<void> {
    return this.ai.generateSpeechStream(text, onChunk);
  }

  private assertPhase(
    state: SessionState,
    allowed: SessionState["phase"][],
  ): void {
    if (!allowed.includes(state.phase)) {
      throw new InterviewError(
        `Invalid phase: expected [${allowed.join(", ")}], got ${state.phase}`,
        409,
      );
    }
  }
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class InterviewError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "InterviewError";
  }
}
