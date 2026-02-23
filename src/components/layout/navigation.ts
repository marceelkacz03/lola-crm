import type { AppRole } from "@/lib/types";

export type AppNavLink = {
  href: string;
  label: string;
  roles: AppRole[];
};

export const appNavLinks: AppNavLink[] = [
  { href: "/dashboard", label: "Panel", roles: ["ADMIN", "BOARD", "MANAGER", "STAFF"] },
  { href: "/accounts", label: "Klienci", roles: ["ADMIN", "BOARD", "MANAGER"] },
  { href: "/events", label: "Kalendarz", roles: ["ADMIN", "BOARD", "MANAGER", "STAFF"] }
];
