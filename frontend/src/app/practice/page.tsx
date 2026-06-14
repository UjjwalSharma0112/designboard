"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import InterviewRunner from "@/features/interview/components/InterviewRunner";
import RequireAuth from "@/features/auth/RequireAuth";

// The runner lives on the dark, low-distraction "interview room" theme. The
// data-theme switch re-points every design token; runner-surface + grain add
// the lit, textured atmosphere. The runner itself is driven by the machine.
export default function PracticePage() {
  const router = useRouter();

  const handleLeaveRoom = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("interview_room.active_session_id");
    }
    router.push("/");
  };

  return (
    <div className="runner-surface grain relative flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
        <Link
          href="/"
          onClick={handleLeaveRoom}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Leave room
        </Link>
        <span className="font-display text-sm text-muted">System Design Room</span>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 sm:px-6">
        <RequireAuth>
          <InterviewRunner />
        </RequireAuth>
      </main>
    </div>
  );
}
