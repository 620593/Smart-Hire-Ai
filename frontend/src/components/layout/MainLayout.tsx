import type { ReactNode } from "react";

import { Outlet } from "react-router-dom";

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
