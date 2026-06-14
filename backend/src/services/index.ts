import { InMemorySessionStore } from "../session/InMemorySessionStore";
import { InterviewStateMachine } from "./interview.service";
import { InterviewAI } from "../ai/AIProvider";
import { TranscriptionService } from "./transcription.service";

const store = new InMemorySessionStore();

export const interviewService = new InterviewStateMachine(
  store,
  new InterviewAI(),
);

export const transcriptionService = new TranscriptionService();

