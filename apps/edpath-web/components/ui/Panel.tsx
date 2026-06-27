/**
 * EdPath panel primitive — consistent card padding, elevation, and variants.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const panelVariants = cva("flex flex-col border", {
  variants: {
    size: {
      sm: "gap-3 p-4",
      md: "gap-4 p-5",
    },
    variant: {
      default: "border-border bg-surface shadow-[var(--shadow-sm)]",
      muted: "border-border bg-paper shadow-[var(--shadow-xs)]",
      inverse: "border-transparent bg-surface-inverse text-white shadow-[var(--shadow-md)]",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

interface PanelProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof panelVariants> {}

function Panel({
  className,
  size,
  variant,
  ...props
}: PanelProps): React.ReactElement {
  return (
    <div
      data-slot="panel"
      data-size={size}
      data-variant={variant}
      className={cn(
        panelVariants({ size, variant }),
        "rounded-[var(--radius-md)]",
        className,
      )}
      {...props}
    />
  );
}

export { Panel, panelVariants };
