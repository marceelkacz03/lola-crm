"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { appNavLinks } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/i18n-pl";
import type { AppRole } from "@/lib/types";

type MobileNavProps = {
  role: AppRole;
  email: string;
};

export const MobileNav = ({ role, email }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Menu
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Zamknij menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 z-10 h-full w-[82%] max-w-[320px] overflow-y-auto border-r border-line bg-panel p-4 shadow-card backdrop-blur-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/branding/sygnet1.png"
                  alt="Logo LOLA"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  priority
                />
                <div>
                  <p className="font-[var(--font-heading)] text-2xl">LOLA Client Hub</p>
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Zamknij
              </Button>
            </div>

            <nav className="space-y-1">
              {appNavLinks
                .filter((item) => item.roles.includes(role))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-ink transition hover:bg-accent/20 hover:text-[#fcf8f0]"
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>

            <div className="mt-6 space-y-2 border-t border-line pt-4">
              <Badge>{roleLabel(role)}</Badge>
              <p className="text-xs text-muted break-all">{email}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};
