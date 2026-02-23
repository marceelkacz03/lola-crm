import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex rounded-full border border-line bg-black/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted",
      className
    )}
    {...props}
  />
);
