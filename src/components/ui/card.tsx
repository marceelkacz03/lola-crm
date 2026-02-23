import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border border-line bg-panel/85 p-5 shadow-card backdrop-blur-sm", className)} {...props} />
);
