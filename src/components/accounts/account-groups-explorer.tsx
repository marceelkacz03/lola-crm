"use client";

import { useState } from "react";

import { AccountAiResearch } from "@/components/accounts/account-ai-research";
import { AccountDeleteButton } from "@/components/accounts/account-delete-button";
import { AccountEmailDraftButton } from "@/components/accounts/account-email-draft-button";
import { AccountSalesQuickEdit } from "@/components/accounts/account-sales-quick-edit";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { accountSourceLabel, accountTypeLabel, salesStatusLabel } from "@/lib/i18n-pl";
import type { AccountSource, AccountType, AiResearch, SalesStatus } from "@/lib/types";

type AccountRow = {
  id: string;
  name: string;
  type: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  sales_status: string;
  estimated_value: number | null;
  next_followup_date: string | null;
  ai_research?: AiResearch | null;
  ai_lead_score?: number | null;
  ai_angle?: string | null;
};

type AccountGroupsExplorerProps = {
  accounts: AccountRow[];
  editable: boolean;
};

type AccountFilter = "all" | AccountType;

const accountTypeOrder: AccountType[] = ["company", "private", "wedding_planner"];

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const AccountGroupsExplorer = ({ accounts, editable }: AccountGroupsExplorerProps) => {
  const [openGroup, setOpenGroup] = useState<AccountFilter | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const groupedAccounts = accountTypeOrder.map((type) => ({
    type,
    label: accountTypeLabel(type),
    count: accounts.filter((account) => account.type === type).length,
    accounts: accounts.filter((account) => account.type === type)
  }));

  const visibleAccounts =
    openGroup === "all"
      ? accounts
      : openGroup
        ? accounts.filter((account) => account.type === openGroup)
        : [];
  const searchTokens = normalizeSearchValue(searchTerm).split(" ").filter(Boolean);
  const filteredAccounts = visibleAccounts.filter((account) => {
    if (!searchTokens.length) return true;

    const searchableText = normalizeSearchValue(
      [account.name, account.contact_person ?? "", account.email ?? "", account.phone ?? ""].join(" ")
    );

    return searchTokens.every((token) => searchableText.includes(token));
  });

  const visibleLabel = openGroup === "all" ? "Wszyscy klienci" : openGroup ? accountTypeLabel(openGroup) : null;

  const toggleGroup = (group: AccountFilter) => {
    setOpenGroup((current) => (current === group ? null : group));
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button type="button" onClick={() => toggleGroup("all")} className="text-left">
          <Card
            className={cn(
              "transition-colors hover:border-accent hover:text-[#fcf8f0]",
              openGroup === "all" ? "border-accent" : ""
            )}
          >
            <p className="text-xs uppercase tracking-wide text-muted">Wszyscy klienci</p>
            <p className="mt-2 font-[var(--font-heading)] text-2xl sm:text-3xl">{accounts.length}</p>
          </Card>
        </button>

        {groupedAccounts.map((group) => (
          <button key={group.type} type="button" onClick={() => toggleGroup(group.type)} className="text-left">
            <Card
              className={cn(
                "transition-colors hover:border-accent hover:text-[#fcf8f0]",
                openGroup === group.type ? "border-accent" : ""
              )}
            >
              <p className="text-xs uppercase tracking-wide text-muted">{group.label}</p>
              <p className="mt-2 font-[var(--font-heading)] text-2xl sm:text-3xl">{group.count}</p>
            </Card>
          </button>
        ))}
      </section>

      {openGroup ? (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <h2 className="font-[var(--font-heading)] text-xl sm:text-2xl">{visibleLabel}</h2>
              <span className="rounded-full border border-line bg-black/20 px-3 py-1 text-xs text-muted">
                {filteredAccounts.length}
              </span>
            </div>

            <div className="max-w-md">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Szukaj klienta, firmy, osoby kontaktowej..."
              />
            </div>

            {!filteredAccounts.length ? (
              <p className="text-sm text-muted">
                {searchTokens.length ? "Brak wynikow dla podanej frazy." : "Brak klientow w tej grupie."}
              </p>
            ) : null}

            <ul className="space-y-3">
              {filteredAccounts.map((account) => (
                <li key={account.id} className="rounded-lg border border-line bg-black/20">
                  <details className="group">
                    <summary className="cursor-pointer list-none px-3 py-3 font-medium">
                      <div className="flex items-center justify-between gap-3">
                        <span>{account.name}</span>
                        <span className="text-xs text-muted group-open:hidden">Rozwin</span>
                      </div>
                    </summary>

                    <div className="border-t border-line px-3 py-3">
                      <div className="space-y-1 text-xs text-muted">
                        <p>Typ: {accountTypeLabel(account.type as AccountType)}</p>
                        <p>Kontakt: {account.contact_person ?? "-"}</p>
                        <p>E-mail: {account.email ?? "-"}</p>
                        <p>Telefon: {account.phone ?? "-"}</p>
                        <p>Zrodlo: {accountSourceLabel(account.source as AccountSource)}</p>
                        <p>Status: {salesStatusLabel(account.sales_status as SalesStatus)}</p>
                        <p>Wartosc: {account.estimated_value ?? "-"}</p>
                        <p>Nastepny kontakt: {account.next_followup_date ?? "-"}</p>
                      </div>

                      <div className="mt-3">
                        <AccountSalesQuickEdit
                          accountId={account.id}
                          status={account.sales_status as SalesStatus}
                          estimatedValue={account.estimated_value ? Number(account.estimated_value) : null}
                          nextFollowupDate={account.next_followup_date}
                          editable={editable}
                        />
                      </div>

                      {editable ? (
                        <AccountAiResearch
                          accountId={account.id}
                          initialResearch={account.ai_research ?? null}
                          initialScore={account.ai_lead_score ?? null}
                          initialAngle={account.ai_angle ?? null}
                        />
                      ) : null}

                      {editable ? (
                        <div className="mt-2">
                          <AccountEmailDraftButton
                            accountId={account.id}
                            accountEmail={account.email}
                          />
                        </div>
                      ) : null}

                      {editable ? (
                        <div className="mt-2">
                          <AccountDeleteButton accountId={account.id} accountName={account.name} editable={editable} />
                        </div>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ) : null}
    </div>
  );
};
