"use client";

import { CheckIcon, XIcon } from "lucide-react";

import { Icon } from "@/components/ui/Icon";

const DOS = [
  "One PDF file, under 15 MB",
  "Text you can select or copy (not a scan)",
  "Unencrypted, readable document",
  "Focused length (roughly under 50 pages)",
] as const;

const DONTS = [
  "Word docs, images, or other file types",
  "Scanned or image-only PDFs",
  "Password-protected PDFs",
  "Empty or extremely short PDFs",
] as const;

export function UploadGuidelines() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-success-ink">Do</p>
        <ul className="space-y-1.5">
          {DOS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-1.5 text-xs leading-snug text-ink-muted"
            >
              <Icon icon={CheckIcon} size="xs" variant="success" className="mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-error-ink">Don&apos;t</p>
        <ul className="space-y-1.5">
          {DONTS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-1.5 text-xs leading-snug text-ink-muted"
            >
              <Icon icon={XIcon} size="xs" variant="error" className="mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
