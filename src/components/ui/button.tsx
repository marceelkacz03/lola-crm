import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-[#fcf8f0] hover:bg-[#b70712] shadow-glow",
  ghost: "bg-transparent text-ink hover:bg-white/10",
  outline: "border border-line bg-black/20 text-ink hover:border-accent hover:text-[#fcf8f0]",
  danger: "bg-red-700 text-white hover:bg-red-800"
};

export const Button = ({ className, variant = "primary", ...props }: ButtonProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      className
    )}
    {...props}
  />
);
