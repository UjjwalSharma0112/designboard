import { authClient, getAuthClient } from "../auth/authClient";
import type {
  StartResponse,
  AnswerResponse,
  FeedbackResponse,
  SessionConfig,
  InterviewHistoryItem,
  SessionState,
} from "@/lib/types";
import { useAuth } from "../auth/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthClient().getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event("auth-expired"));
    }
    throw new Error(data.message || data.error || "API request failed");
  }

  return data;
}

export const interviewClient = {
  async start(config: SessionConfig): Promise<StartResponse> {
    return request<StartResponse>("/interview/start", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  async answer(sessionId: string, answer: string): Promise<AnswerResponse> {
    return request<AnswerResponse>("/interview/answer", {
      method: "POST",
      body: JSON.stringify({ sessionId, answer }),
    });
  },

  async getFeedback(sessionId: string): Promise<FeedbackResponse> {
    return request<FeedbackResponse>(
      `/interview/feedback?sessionId=${sessionId}`,
    );
  },

  async getSession(sessionId: string): Promise<SessionState> {
    return request<SessionState>(`/interview/session?sessionId=${sessionId}`);
  },

  async getHistory(): Promise<InterviewHistoryItem[]> {
    return request<InterviewHistoryItem[]>("/user/history");
  },

  async getSpeechStream(text: string): Promise<ReadableStream<Uint8Array>> {
    const token = getAuthClient().getToken();
    const res = await fetch(`${API_BASE}/interview/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data.message || data.error || "Failed to fetch speech stream",
      );
    }
    if (!res.body) {
      throw new Error("No response body received from speech stream endpoint");
    }
    return res.body;
  },

  async transcribe(audioBlob: Blob): Promise<{ text: string }> {
    const token = getAuthClient().getToken();
    const res = await fetch(`${API_BASE}/interview/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": audioBlob.type || "audio/webm",
        Authorization: `Bearer ${token}`,
      },
      body: audioBlob,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.message || data.error || "Failed to transcribe audio",
      );
    }
    return data;
  },

  async getStreamingToken(): Promise<{ token: string }> {
    return request<{ token: string }>("/interview/token");
  },
};
