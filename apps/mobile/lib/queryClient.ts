import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 Minuten
      gcTime: 24 * 60 * 60 * 1000, // 24 Stunden
    },
  },
});
