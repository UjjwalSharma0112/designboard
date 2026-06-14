import type { ISessionStore } from "./ISessionStore";
import type { SessionState } from "../types/index";

export class InMemorySessionStore implements ISessionStore {
  private store = new Map<string, SessionState>();

  async get(sessionId: string): Promise<SessionState | null> {
    return this.store.get(sessionId) ?? null;
  }

  async set(sessionId: string, state: SessionState): Promise<void> {
    this.store.set(sessionId, state);
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  async list(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  /** Useful in tests to start clean */
  clear(): void {
    this.store.clear();
  }
}
