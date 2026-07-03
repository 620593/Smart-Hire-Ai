import type { ReactNode } from "react";

import { Outlet } from "react-router-dom";

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
