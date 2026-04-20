"use client";

import { useState } from "react";

import { AccountEmailDraftModal } from "@/components/accounts/account-email-draft-modal";
import { Button } from "@/components/ui/button";

type AccountEmailDraftButtonProps = {
  accountId: string;
  accountEmail: string | null;
  onSent?: (draftId: string) => void;
};

export const AccountEmailDraftButton = ({ accountId, accountEmail, onSent }: AccountEmailDraftButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="text-xs">
        ✉ Draft email
      </Button>
      <AccountEmailDraftModal
        accountId={accountId}
        accountEmail={accountEmail}
        open={open}
        onClose={() => setOpen(false)}
        onSent={onSent}
      />
    </>
  );
};
