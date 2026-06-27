"use client";

/**
 * Landing hero copy and step-by-step value proposition.
 */

import {
  CircleHelpIcon,
  FileUpIcon,
  GraduationCapIcon,
  ListChecksIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "@/components/ui/Icon";

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "Upload one PDF with selectable text", icon: FileUpIcon },
  { label: "Review and approve your lesson plan", icon: ListChecksIcon },
  { label: "Answer questions one at a time with feedback", icon: CircleHelpIcon },
  { label: "Finish with a personalized study summary", icon: GraduationCapIcon },
];

export function LandingHero() {
  return (
    <section className="flex w-full flex-col gap-4 text-left">
      <h1 className="font-display text-3xl font-semibold tracking-[var(--tracking-display)] text-ink lg:text-4xl">
        Turn your PDF into a{" "}
        <span className="text-primary">guided lesson.</span>
      </h1>
      <ol className="flex flex-col gap-4">
        {STEPS.map((step) => (
          <li key={step.label} className="flex items-start gap-3">
            <Icon icon={step.icon} size="sm" className="mt-0.5" />
            <p className="text-base text-ink">{step.label}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
