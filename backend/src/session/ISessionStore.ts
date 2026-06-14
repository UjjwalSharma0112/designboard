import type { SessionState } from "../types/index";

/**
 * All session persistence goes through this interface.
 * Today: InMemorySessionStore
 * Later: RedisSessionStore — swap in app.ts, nothing else changes.
 */
export interface ISessionStore {
  get(sessionId: string): Promise<SessionState | null>;
  set(sessionId: string, state: SessionState): Promise<void>;
  delete(sessionId: string): Promise<void>;
  /** Optional: list all active session IDs (useful for admin/debug) */
  list?(): Promise<string[]>;
}
