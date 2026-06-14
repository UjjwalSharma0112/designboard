// TanStack Query client setup.
// A single QueryClient instance is shared across the app via the Providers
// wrapper (see src/app/providers.tsx). Real queries/mutations are added later.
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Sensible placeholder defaults; tune when real queries land.
        staleTime: 60 * 1000,
      },
    },
  });
}
