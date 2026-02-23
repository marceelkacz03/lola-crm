import Link from "next/link";
import Image from "next/image";

import { appNavLinks } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/i18n-pl";
import type { AppRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type SidebarProps = {
  role: AppRole;
  email: string;
  className?: string;
};

export const AppSidebar = ({ role, email, className }: SidebarProps) => (
  <aside className={cn("flex h-screen w-full flex-col border-r border-line bg-black/35 p-4 backdrop-blur-md", className)}>
    <div className="mb-8">
      <div className="flex items-center gap-2">
        <Image
          src="/branding/sygnet1.png"
          alt="Logo LOLA"
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          priority
        />
        <p className="-ml-0.5 font-[var(--font-heading)] text-2xl -translate-y-0.5">LOLA Client Hub</p>
      </div>
    </div>
    <nav className="space-y-1">
      {appNavLinks
        .filter((item) => item.roles.includes(role))
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-ink transition hover:bg-accent/20 hover:text-[#fcf8f0]"
          >
            {item.label}
          </Link>
        ))}
    </nav>
    <div className="mt-auto space-y-2 border-t border-line pt-4">
      <Badge>{roleLabel(role)}</Badge>
      <p className="text-xs text-muted break-all">{email}</p>
    </div>
  </aside>
);
