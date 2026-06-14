// Shared TypeScript types for the AI Mock Interview app.
//
// This file is the single source of truth for the interview domain model.

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

export type Difficulty = "easy" | "medium" | "hard";

export interface SessionConfig {
  topic: string;
  difficulty: Difficulty;
  interviewContext: string;
}

export interface Turn {
  question: string;
  answer: string;
  type: "question" | "follow_up";
  questionNumber: number;
}

// ---------------------------------------------------------------------------
// API Contract
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: "start_session"; config: SessionConfig }
  | { type: "submit_answer"; answer: string }
  | { type: "end_session" };

export type StartRequest = SessionConfig;

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
  perQuestion: {
    questionIndex: number;
    question: string;
    score: number;
    followUpCount: number;
    strengths: string[];
    gaps: string[];
  }[];
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewHistoryItem extends FeedbackResponse {
  sessionId: string;
  topic: string;
  difficulty: Difficulty;
  interviewContext: string;
  createdAt: string;
}

export type ServerMessage =
  | { type: "question" | "follow_up"; question: string; questionNumber: number }
  | { type: "evaluating" }
  | { type: "feedback"; report: FeedbackResponse }
  | { type: "session_ended" }
  | { type: "error"; message: string };

export interface SessionState {
  sessionId: string;
  topic: string;
  difficulty: Difficulty;
  interviewContext: string;
  phase: "ASK_QUESTION" | "FOLLOW_UP_QUESTION" | "END";
  questions: string[];
  currentQuestionIndex: number;
  followUpCount: number;
  history: QuestionRecord[];
  currentRecord: QuestionRecord | null;
  createdAt: number;
  updatedAt: number;
}

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
  score: number;
  strengths: string[];
  gaps: string[];
  needsFollowUp: boolean;
  followUpQuestion: string | null;
}
