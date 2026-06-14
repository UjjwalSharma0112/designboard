export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  inviteCode: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const SESSION_KEY = "interview_room.session";

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthClient {
  signUp(input: SignUpInput): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  getToken(): string | null;
}

function persistToken(
  token: string,
  email: string,
  fullName: string,
): AuthUser {
  const user = { id: email, email, fullName };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  }
  return user;
}

export const authClient: AuthClient = {
  async signUp(input) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.fullName,
        email: input.email,
        password: input.password,
        inviteCode: input.inviteCode,
      }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new AuthError("signup_failed", data.message || "Signup failed");
    return persistToken(data.token, input.email, input.fullName);
  },

  async signIn(email, password) {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok)
      throw new AuthError(
        "invalid_credentials",
        data.message || "Invalid credentials",
      );
    return persistToken(data.token, email, data.name);
  },

  async signInWithGoogle() {
    throw new Error("Google sign-in is not implemented yet.");
  },

  async signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  async getCurrentUser() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).user : null;
  },

  getToken() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).token : null;
  },
};

export function getAuthClient() {
  return authClient;
}
