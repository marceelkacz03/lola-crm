"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

export const Modal = ({ open, onClose, title, children, className }: ModalProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-line bg-panel/95 p-6 shadow-card backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
          <h2 className="font-[var(--font-heading)] text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted transition-colors hover:text-ink"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
