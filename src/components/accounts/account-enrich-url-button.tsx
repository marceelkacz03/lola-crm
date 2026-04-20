"use client";

import { useState } from "react";

import { AccountEnrichUrlModal } from "@/components/accounts/account-enrich-url-modal";
import { Button } from "@/components/ui/button";

export const AccountEnrichUrlButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        + Dodaj z URL
      </Button>
      <AccountEnrichUrlModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};
