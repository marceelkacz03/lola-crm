"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/form";
import { roleLabel } from "@/lib/i18n-pl";
import type { AppRole } from "@/lib/types";

export type UserRoleRow = {
  id: string;
  email: string;
  role: AppRole;
};

type RoleManagerProps = {
  users: UserRoleRow[];
};

const roles: AppRole[] = ["ADMIN", "BOARD", "MANAGER", "STAFF"];

export const RoleManager = ({ users }: RoleManagerProps) => {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onRoleChange = async (id: string, role: AppRole) => {
    setPendingId(id);
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    setPendingId(null);
    router.refresh();
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-line bg-black/20 p-3">
            <p className="text-xs text-muted">Uzytkownik</p>
            <p className="mt-1 break-all text-sm">{user.email}</p>
            <p className="mt-3 text-xs text-muted">Aktualna rola</p>
            <p className="mt-1 text-sm">{roleLabel(user.role)}</p>
            <div className="mt-3">
              <p className="mb-1 text-xs text-muted">Zmien role</p>
              <Select
                value={user.role}
                disabled={pendingId === user.id}
                onChange={(event) => onRoleChange(user.id, event.target.value as AppRole)}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>

      <table className="hidden w-full min-w-[760px] text-left text-sm md:table">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="py-2">Uzytkownik</th>
            <th>Aktualna rola</th>
            <th>Zmien role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr className="border-t border-line" key={user.id}>
              <td className="py-2">{user.email}</td>
              <td>{roleLabel(user.role)}</td>
              <td className="w-[220px]">
                <Select
                  value={user.role}
                  disabled={pendingId === user.id}
                  onChange={(event) => onRoleChange(user.id, event.target.value as AppRole)}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
