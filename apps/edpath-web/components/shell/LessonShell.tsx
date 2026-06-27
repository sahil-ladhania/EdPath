"use client";

/**
 * Lesson layout grid — objective rail column and main content column.
 */

import type { ReactNode } from "react";

interface LessonShellProps {
  rail: ReactNode;
  children: ReactNode;
}

export function LessonShell({ rail, children }: LessonShellProps): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 lg:grid lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:gap-10 lg:px-6 lg:py-8">
      <aside>{rail}</aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
