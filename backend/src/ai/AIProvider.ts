import type { AIProvider } from "../types/index";
import type { AnswerEvaluation, QuestionRecord } from "../types/index";
import { callAI, generateSpeech, generateSpeechStream } from "./ai";
import {
  buildAnswerEvaluationPrompt,
  buildIntroPrompt,
  buildQuestionsPrompt,
  buildReportPrompt,
  buildDiagramSummaryPrompt,
} from "./prompts";

export class InterviewAI implements AIProvider {
  async generateIntro(
    topic: string,
    difficulty: string,
    interviewContext: string,
  ): Promise<string> {
    return callAI(buildIntroPrompt(topic, difficulty, interviewContext, 5));
  }

  async generateQuestions(
    topic: string,
    difficulty: string,
    interviewContext: string,
    count: number,
  ): Promise<string[]> {
    const raw = await callAI(
      buildQuestionsPrompt(topic, difficulty, interviewContext, count),
    );
    return JSON.parse(raw) as string[];
  }

  async evaluateAnswer(
    question: string,
    answer: string,
    followUps: Array<{ question: string; answer: string }>,
    topic: string,
    interviewContext: string,
    diagramSummary?: string,
  ): Promise<AnswerEvaluation> {
    const raw = await callAI(
      buildAnswerEvaluationPrompt(
        question,
        answer,
        followUps,
        topic,
        interviewContext,
        diagramSummary,
      ),
    );
    return JSON.parse(raw) as AnswerEvaluation;
  }

  async generateReport(
    topic: string,
    interviewContext: string,
    history: QuestionRecord[],
  ): Promise<{ summary: string; strengths: string[]; improvements: string[] }> {
    const raw = await callAI(buildReportPrompt(topic, interviewContext, history));
    return JSON.parse(raw) as {
      summary: string;
      strengths: string[];
      improvements: string[];
    };
  }

  async generateSpeech(text: string): Promise<string> {
    return generateSpeech(text);
  }

  async generateSpeechStream(text: string, onChunk: (chunk: Buffer) => void): Promise<void> {
    return generateSpeechStream(text, onChunk);
  }

  async summarizeDiagram(interviewContext: string): Promise<string> {
    return callAI(buildDiagramSummaryPrompt(interviewContext));
  }
}
