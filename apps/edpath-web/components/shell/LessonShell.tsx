"use client";

import type { ReactNode } from "react";

interface LessonShellProps {
  rail: ReactNode;
  children: ReactNode;
}

export function LessonShell({ rail, children }: LessonShellProps): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
      <aside>{rail}</aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
