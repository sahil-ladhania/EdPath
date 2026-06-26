import * as React from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const mediaSlotVariants = cva(
  "relative flex w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-border bg-paper",
  {
    variants: {
      aspect: {
        product: "aspect-video",
        square: "aspect-square",
        illustration: "aspect-[4/3]",
      },
    },
    defaultVariants: {
      aspect: "product",
    },
  },
);

interface MediaSlotProps
  extends React.ComponentProps<"figure">,
    VariantProps<typeof mediaSlotVariants> {
  src?: string;
  alt?: string;
  caption?: string;
}

function MediaSlot({
  aspect,
  src,
  alt = "",
  caption,
  className,
  ...props
}: MediaSlotProps): React.ReactElement {
  return (
    <figure className={cn("space-y-2", className)} {...props}>
      <div className={cn(mediaSlotVariants({ aspect }))}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-muted">
            <Icon icon={ImageIcon} size="md" />
            <span className="text-xs">Image placeholder</span>
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="text-center text-xs text-ink-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export { MediaSlot, mediaSlotVariants };
