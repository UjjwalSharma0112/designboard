import { AssemblyAI } from "assemblyai";

export class TranscriptionService {
  private client: AssemblyAI | null = null;

  constructor() {
    const apiKey = process.env.ASSEMBLY_AI_API_KEY;
    if (apiKey) {
      this.client = new AssemblyAI({
        apiKey,
      });
    } else {
      console.warn("ASSEMBLY_AI_API_KEY is not defined in the environment variables.");
    }
  }

  async getTemporaryToken(): Promise<string> {
    if (!this.client) {
      throw new Error("AssemblyAI client is not initialized. Please set ASSEMBLY_AI_API_KEY.");
    }
    try {
      const token = await this.client.realtime.createTemporaryToken({
        expires_in: 300,
      });
      return token;
    } catch (error) {
      console.error("AssemblyAI token generation error:", error);
      throw error;
    }
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    if (!this.client) {
      throw new Error("AssemblyAI client is not initialized. Please set ASSEMBLY_AI_API_KEY.");
    }
    try {
      const transcript = await this.client.transcripts.transcribe({
        audio: audioBuffer,
      });
      return transcript.text || "";
    } catch (error) {
      console.error("AssemblyAI transcription error:", error);
      throw error;
    }
  }
}
