"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import InterviewRunner from "@/features/interview/components/InterviewRunner";

// The runner lives on the dark, low-distraction "interview room" theme. The
// data-theme switch re-points every design token; runner-surface + grain add
// the lit, textured atmosphere. The runner itself is driven by the machine.
export default function PracticePage() {
  const router = useRouter();

  const handleLeaveRoom = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("interview_room.active_session_id");
      sessionStorage.removeItem("system_design_playground.selected_question");
      
      // Clean sessionStorage diagram entries
      const sessionKeys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("playground_diagram_")) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach(k => sessionStorage.removeItem(k));

      // Clean localStorage diagram entries
      localStorage.removeItem("system_design_playground.selected_question");
      const localKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("playground_diagram_")) {
          localKeys.push(key);
        }
      }
      localKeys.forEach(k => localStorage.removeItem(k));
    }
    router.push("/");
  };

  return (
    <div className="runner-surface grain relative flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-none px-6 md:px-10 py-5 items-center justify-between">
        <Link
          href="/"
          onClick={handleLeaveRoom}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Leave room
        </Link>
        <span className="font-display text-sm text-muted">designboard</span>
      </header>

      <main className="mx-auto w-full max-w-none px-6 md:px-10 flex-1 flex flex-col pb-6">
        <InterviewRunner />
      </main>
    </div>
  );
}
