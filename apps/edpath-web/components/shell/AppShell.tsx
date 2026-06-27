"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  headerVariant?: "default" | "landing";
  modeLabel?: string;
}

export function AppShell({
  children,
  headerVariant = "default",
  modeLabel,
}: AppShellProps): ReactNode {
  const isLanding = headerVariant === "landing";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header
        className="sticky top-0 z-50 border-b border-border/40 bg-surface/70 backdrop-blur-md backdrop-saturate-150 supports-backdrop-filter:bg-surface/55"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="EdPath home"
            className="flex items-center gap-3 text-ink transition-colors hover:text-primary"
          >
            <Image
              src="/edpath-logo.svg"
              alt=""
              width={42}
              height={42}
              priority
              className="size-10 shrink-0"
              aria-hidden
            />
            <div className={cn(!isLanding && "space-y-0.5")}>
              <p className="font-display text-xl font-semibold text-ink">
                EdPath
              </p>
              {!isLanding ? (
                <p className="text-sm text-ink-muted">
                  Turn your PDF into a guided lesson
                </p>
              ) : null}
            </div>
          </Link>
          {!isLanding && modeLabel ? (
            <Badge
              variant="secondary"
              className="rounded-sm px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-primary"
            >
              {modeLabel}
            </Badge>
          ) : null}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
