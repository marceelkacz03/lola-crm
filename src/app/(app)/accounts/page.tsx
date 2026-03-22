import { AccountCreateForm } from "@/components/accounts/account-create-form";
import { AccountDeleteButton } from "@/components/accounts/account-delete-button";
import { AccountSalesQuickEdit } from "@/components/accounts/account-sales-quick-edit";
import { Card } from "@/components/ui/card";
import { requireAnyRole } from "@/lib/auth";
import { accountSourceLabel, accountTypeLabel, salesStatusLabel } from "@/lib/i18n-pl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountSource, AccountType, SalesStatus } from "@/lib/types";

const accountTypeOrder: AccountType[] = ["company", "private", "wedding_planner"];

export default async function AccountsPage() {
  const user = await requireAnyRole(["ADMIN", "BOARD", "MANAGER"]);
  const supabase = await createSupabaseServerClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type,contact_person,email,phone,source,sales_status,estimated_value,next_followup_date,created_at")
    .order("created_at", { ascending: false });

  const editable = user.role === "ADMIN" || user.role === "MANAGER";
  const accountRows = accounts ?? [];
  const groupedAccounts = accountTypeOrder.map((type) => ({
    type,
    label: accountTypeLabel(type),
    count: accountRows.filter((account) => account.type === type).length,
    accounts: accountRows.filter((account) => account.type === type)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-4xl">Klienci</h1>
        <p className="text-sm text-muted">Baza klientow z widokiem statusu sprzedazowego i follow-up.</p>
      </div>

      {editable ? (
        <Card>
          <h2 className="mb-4 font-[var(--font-heading)] text-2xl">Dodaj klienta</h2>
          <AccountCreateForm />
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Wszyscy klienci</p>
          <p className="mt-2 font-[var(--font-heading)] text-2xl sm:text-3xl">{accountRows.length}</p>
        </Card>
        {groupedAccounts.map((group) => (
          <Card key={group.type}>
            <p className="text-xs uppercase tracking-wide text-muted">{group.label}</p>
            <p className="mt-2 font-[var(--font-heading)] text-2xl sm:text-3xl">{group.count}</p>
          </Card>
        ))}
      </section>

      <Card>
        <div className="space-y-4">
          {groupedAccounts.map((group) => (
            <section key={group.type} id={`account-group-${group.type}`} className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <h2 className="font-[var(--font-heading)] text-xl sm:text-2xl">{group.label}</h2>
                <span className="rounded-full border border-line bg-black/20 px-3 py-1 text-xs text-muted">
                  {group.count}
                </span>
              </div>

              {!group.accounts.length ? <p className="text-sm text-muted">Brak klientow w tej grupie.</p> : null}

              <ul className="space-y-3">
                {group.accounts.map((account) => (
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
                          <div className="mt-2">
                            <AccountDeleteButton accountId={account.id} accountName={account.name} editable={editable} />
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
