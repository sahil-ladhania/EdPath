"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  children: ReactNode;
  modeLabel: string;
}

export function AppShell({ children, modeLabel }: AppShellProps): ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-border bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-ink transition-colors hover:text-primary"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-sm">
              EP
            </div>
            <div className="space-y-0.5">
              <p className="font-display text-xl text-ink">EdPath</p>
              <p className="text-sm text-ink-muted">
                Turn one PDF into a guided lesson
              </p>
            </div>
          </Link>
          <Badge variant="secondary" className="uppercase">
            {modeLabel}
          </Badge>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
