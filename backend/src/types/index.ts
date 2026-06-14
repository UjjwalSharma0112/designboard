import { Request } from "express";
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export interface AIProvider {
  generateIntro(
    topic: string,
    difficulty: string,
    interviewContext: string,
  ): Promise<string>;
  generateQuestions(
    topic: string,
    difficulty: string,
    interviewContext: string,
    count: number,
  ): Promise<string[]>;
  evaluateAnswer(
    question: string,
    answer: string,
    followUps: Array<{ question: string; answer: string }>,
    topic: string,
    interviewContext: string,
    diagramSummary?: string,
  ): Promise<AnswerEvaluation>;
  generateReport(
    topic: string,
    interviewContext: string,
    history: QuestionRecord[],
  ): Promise<{ summary: string; strengths: string[]; improvements: string[] }>;
  generateSpeech(text: string): Promise<string>;
  generateSpeechStream(text: string, onChunk: (chunk: Buffer) => void): Promise<void>;
  summarizeDiagram(interviewContext: string): Promise<string>;
}
// ─── State Machine States ────────────────────────────────────────────────────

export type InterviewPhase = "ASK_QUESTION" | "FOLLOW_UP_QUESTION" | "END";

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface QuestionRecord {
  questionIndex: number;
  question: string;
  answer: string;
  followUps: FollowUpRecord[];
  evaluation: AnswerEvaluation | null;
}

export interface FollowUpRecord {
  question: string;
  answer: string;
}

export interface AnswerEvaluation {
  score: number; // 1–10
  strengths: string[];
  gaps: string[];
  needsFollowUp: boolean;
  followUpQuestion: string | null;
}

// ─── Session State ────────────────────────────────────────────────────────────

export interface SessionState {
  sessionId: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  interviewContext: string;
  diagramSummary?: string;
  phase: InterviewPhase;

  questions: string[];
  currentQuestionIndex: number;
  followUpCount: number;

  history: QuestionRecord[];
  currentRecord: QuestionRecord | null;

  createdAt: number;
  updatedAt: number;
}

// ─── API Contract ─────────────────────────────────────────────────────────────

export interface StartRequest {
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  interviewContext: string;
}

export interface StartResponse {
  sessionId: string;
  intro: string;
  question: string;
  questionNumber: number;
  totalQuestions: number;
  audio?: string;
}

export interface AnswerRequest {
  sessionId: string;
  answer: string;
}

export interface AnswerResponse {
  type: "question" | "follow_up" | "end";
  question: string | null;
  questionNumber: number | null;
  totalQuestions: number;
  isFinal: boolean;
  audio?: string;
}

export interface FeedbackResponse {
  overallScore: number;
  totalQuestions: number;
  perQuestion: PerQuestionFeedback[];
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface PerQuestionFeedback {
  questionIndex: number;
  question: string;
  score: number;
  followUpCount: number;
  strengths: string[];
  gaps: string[];
}
