import type { FeedbackResponse } from "@/lib/types";

export type Report = FeedbackResponse;

export function asReport(value: unknown): Report | null {
  if (value && typeof value === "object" && "overallScore" in value) {
    return value as Report;
  }
  return null;
}
