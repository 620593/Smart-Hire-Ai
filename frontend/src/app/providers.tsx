import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import { AuthProvider } from "@/features/auth/AuthContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
