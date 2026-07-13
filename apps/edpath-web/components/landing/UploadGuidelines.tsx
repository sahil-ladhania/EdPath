"use client";

// Import components
import { ArrowRightIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

// Constant for the do guidelines
const DOS = [
  "One PDF file, under 15 MB",
  "Text you can select or copy (not a scan)",
  "Unencrypted, readable document",
  "Focused length (roughly under 50 pages)",
] as const;

// Constant for the don't guidelines
const DONTS = [
  "Word docs, images, or other file types",
  "Scanned or image-only PDFs",
  "Password-protected PDFs",
  "Empty or extremely short PDFs",
] as const;

// Interface for the guideline column props
interface GuidelineColumnProps {
  title: string;
  items: readonly string[];
  tone: "do" | "dont";
  headingIcon: typeof CircleCheckIcon;
};

// Function to render the guideline column
function GuidelineColumn({ title, items, tone, headingIcon }: GuidelineColumnProps) {
  // Check if the tone is do
  const isDo = tone === "do";
  
  // Return the guideline column
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-2.5 transition-colors",
        isDo
          ? "border-success/25 bg-success-soft/40 hover:border-success/40"
          : "border-error/25 bg-error-soft/40 hover:border-error/40",
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon
          icon={headingIcon}
          size="xs"
          variant={isDo ? "success" : "error"}
        />
        <p
          className={cn(
            "text-xs font-semibold",
            isDo ? "text-success-ink" : "text-error-ink",
          )}
        >
          {title}
        </p>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-1.5 text-xs leading-snug text-ink-muted"
          >
            <Icon
              icon={ArrowRightIcon}
              size="xs"
              variant="default"
              className="mt-0.5 shrink-0"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Function to render the upload guidelines
export function UploadGuidelines() {
  // Return the upload guidelines
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <GuidelineColumn
        title="Do"
        items={DOS}
        tone="do"
        headingIcon={CircleCheckIcon}
      />
      <GuidelineColumn
        title="Don't"
        items={DONTS}
        tone="dont"
        headingIcon={CircleXIcon}
      />
    </div>
  );
};