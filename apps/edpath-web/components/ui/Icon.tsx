import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const iconVariants = cva("shrink-0 stroke-[1.5]", {
  variants: {
    size: {
      xs: "size-3.5",
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
    variant: {
      default: "text-ink-muted",
      brand: "text-primary",
      success: "text-success",
      error: "text-error",
      inverse: "text-white",
    },
  },
  defaultVariants: {
    size: "sm",
    variant: "default",
  },
});

interface IconProps extends VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  className?: string;
  label?: string;
}

function Icon({
  icon: LucideComponent,
  size,
  variant,
  className,
  label,
}: IconProps): React.ReactElement {
  return (
    <LucideComponent
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(iconVariants({ size, variant }), className)}
    />
  );
}

export { Icon, iconVariants };
