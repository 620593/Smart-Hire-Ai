import type { ReactNode } from "react";

import { Outlet } from "react-router-dom";

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#070c18] text-[#dae2fd] w-full m-0 p-0 overflow-x-hidden">
      <main className="w-full min-h-screen m-0 p-0">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

