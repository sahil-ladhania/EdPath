"use client";

import Image from "next/image";
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
      <header className="border-b border-border bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-ink transition-colors hover:text-primary"
          >
            <Image
              src="/edpath-logo.svg"
              alt="EdPath"
              width={42}
              height={42}
              priority
              className="size-10"
            />
            <div className="space-y-0.5">
              <p className="font-display text-xl font-semibold text-ink">EdPath</p>
              <p className="text-sm text-ink-muted">
                Turn one PDF into a guided lesson
              </p>
            </div>
          </Link>
          <Badge
            variant="secondary"
            className="rounded-sm px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary"
          >
            {modeLabel}
          </Badge>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
