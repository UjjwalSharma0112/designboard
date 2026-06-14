"use client";

// App-wide client providers: server-state (TanStack Query) and a global motion
// config that respects the user's reduced-motion preference (non-essential
// transforms are disabled automatically when the OS setting is on).
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { makeQueryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/theme/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
