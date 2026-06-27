"use client";

/**
 * Return-to-landing CTA after lesson completion.
 */

import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

export function RestartCta() {
  return (
    <div className="flex justify-end">
      <Button asChild size="lg">
        <Link href="/">
          <Icon icon={RotateCcwIcon} size="sm" variant="inverse" />
          Start a new lesson
        </Link>
      </Button>
    </div>
  );
}
