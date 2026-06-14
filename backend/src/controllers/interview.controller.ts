import { Request, Response } from "express";
import { AuthRequest } from "../types";

import { interviewService as machine, transcriptionService } from "../services";
export const start = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, difficulty, interviewContext } = req.body;

    const result = await machine.start(topic, interviewContext, difficulty);

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
export const answer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, answer } = req.body;

    const result = await machine.answer(sessionId, answer);

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
export const feedback = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.query.sessionId as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await machine.getFeedback(userId, sessionId);

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId query parameter is required" });
      return;
    }

    const state = await machine.getSessionState(sessionId);
    res.json(state);
  } catch (err: any) {
    const status = (err && typeof err === "object" && "statusCode" in err) ? err.statusCode : 500;
    res.status(status).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export const speech = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Transfer-Encoding", "chunked");

    await machine.generateSpeechStream(text, (chunk) => {
      res.write(chunk);
    });

    res.end();
  } catch (err) {
    console.error("Speech stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Unknown error during streaming",
      });
    } else {
      res.end();
    }
  }
};

export const transcribe = async (req: Request, res: Response): Promise<void> => {
  try {
    const audioBuffer = req.body;
    if (!audioBuffer || !Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
      res.status(400).json({ error: "Audio data is required" });
      return;
    }

    const text = await transcriptionService.transcribe(audioBuffer);
    res.json({ text });
  } catch (err) {
    console.error("Transcription controller error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error during transcription",
    });
  }
};

export const getToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = await transcriptionService.getTemporaryToken();
    res.json({ token });
  } catch (err) {
    console.error("Token generation controller error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error generating token",
    });
  }
};



