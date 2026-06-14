import mongoose from "mongoose";

interface IStoredAnswerEvaluation {
  score: number;
  strengths: string[];
  gaps: string[];
  needsFollowUp: boolean;
  followUpQuestion: string | null;
}

interface IStoredFollowUpRecord {
  question: string;
  answer: string;
}

interface IStoredQuestionRecord {
  questionIndex: number;
  question: string;
  answer: string;
  followUps: IStoredFollowUpRecord[];
  evaluation: IStoredAnswerEvaluation | null;
}

interface IStoredPerQuestionFeedback {
  questionIndex: number;
  question: string;
  score: number;
  followUpCount: number;
  strengths: string[];
  gaps: string[];
}

interface IFeedbackHistoryItem {
  sessionId: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  interviewContext: string;
  overallScore: number;
  totalQuestions: number;
  perQuestion: IStoredPerQuestionFeedback[];
  summary: string;
  strengths: string[];
  improvements: string[];
  history: IStoredQuestionRecord[];
  createdAt: Date;
}

interface IUser {
  name: string;
  email: string;
  password: string;
  feedbackHistory: IFeedbackHistoryItem[];
}

const answerEvaluationSchema = new mongoose.Schema<IStoredAnswerEvaluation>(
  {
    score: {
      type: Number,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    gaps: {
      type: [String],
      default: [],
    },
    needsFollowUp: {
      type: Boolean,
      required: true,
    },
    followUpQuestion: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const followUpRecordSchema = new mongoose.Schema<IStoredFollowUpRecord>(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const questionRecordSchema = new mongoose.Schema<IStoredQuestionRecord>(
  {
    questionIndex: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    followUps: {
      type: [followUpRecordSchema],
      default: [],
    },
    evaluation: {
      type: answerEvaluationSchema,
      default: null,
    },
  },
  { _id: false },
);

const perQuestionFeedbackSchema =
  new mongoose.Schema<IStoredPerQuestionFeedback>(
    {
      questionIndex: {
        type: Number,
        required: true,
      },
      question: {
        type: String,
        required: true,
      },
      score: {
        type: Number,
        required: true,
      },
      followUpCount: {
        type: Number,
        required: true,
      },
      strengths: {
        type: [String],
        default: [],
      },
      gaps: {
        type: [String],
        default: [],
      },
    },
    { _id: false },
  );

const feedbackHistorySchema = new mongoose.Schema<IFeedbackHistoryItem>(
  {
    sessionId: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    interviewContext: {
      type: String,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    perQuestion: {
      type: [perQuestionFeedbackSchema],
      default: [],
    },
    summary: {
      type: String,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    history: {
      type: [questionRecordSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  feedbackHistory: {
    type: [feedbackHistorySchema],
    default: [],
  },
});

export default mongoose.model<IUser>("User", userSchema);
