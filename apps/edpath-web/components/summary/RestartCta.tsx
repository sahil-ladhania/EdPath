"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function RestartCta() {
  return (
    <div className="flex justify-end">
      <Button asChild size="lg">
        <Link href="/">Start a new lesson</Link>
      </Button>
    </div>
  );
}
