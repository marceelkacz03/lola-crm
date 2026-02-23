import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-full rounded-md border border-line bg-black/25 px-3 py-2 text-sm text-ink outline-none ring-accent/40 transition placeholder:text-muted/70 focus:border-accent focus:ring-2",
      className
    )}
    {...props}
  />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "w-full rounded-md border border-line bg-black/25 px-3 py-2 text-sm text-ink outline-none ring-accent/40 transition focus:border-accent focus:ring-2",
      className
    )}
    {...props}
  />
);

export const TextArea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      "w-full rounded-md border border-line bg-black/25 px-3 py-2 text-sm text-ink outline-none ring-accent/40 transition placeholder:text-muted/70 focus:border-accent focus:ring-2",
      className
    )}
    {...props}
  />
);
