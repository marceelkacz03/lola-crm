"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AccountDeleteButtonProps = {
  accountId: string;
  accountName: string;
  editable: boolean;
};

export const AccountDeleteButton = ({ accountId, accountName, editable }: AccountDeleteButtonProps) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!editable || deleting) return;

    const confirmed = window.confirm(`Usunac klienta "${accountName}"?`);
    if (!confirmed) return;

    setDeleting(true);
    const response = await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
    setDeleting(false);

    if (!response.ok) {
      window.alert("Nie udalo sie usunac klienta.");
      return;
    }

    router.refresh();
  };

  return (
    <Button type="button" variant="outline" onClick={onDelete} disabled={!editable || deleting}>
      {deleting ? "Usuwanie..." : "Usun"}
    </Button>
  );
};
