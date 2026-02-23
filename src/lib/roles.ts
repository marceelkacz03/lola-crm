import type { AppRole } from "@/lib/types";

const roleLevel: Record<AppRole, number> = {
  STAFF: 1,
  MANAGER: 2,
  BOARD: 3,
  ADMIN: 4
};

export const hasAtLeastRole = (role: AppRole, required: AppRole) => roleLevel[role] >= roleLevel[required];
