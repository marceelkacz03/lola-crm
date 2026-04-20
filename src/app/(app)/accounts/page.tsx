import { AccountGroupsExplorer } from "@/components/accounts/account-groups-explorer";
import { AccountCreateForm } from "@/components/accounts/account-create-form";
import { AccountEnrichUrlButton } from "@/components/accounts/account-enrich-url-button";
import { Card } from "@/components/ui/card";
import { requireAnyRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountsPage({
  searchParams: _searchParams
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const user = await requireAnyRole(["ADMIN", "BOARD", "MANAGER"]);
  const supabase = await createSupabaseServerClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,name,type,contact_person,email,phone,source,sales_status,estimated_value,next_followup_date,created_at")
    .order("created_at", { ascending: false });

  const editable = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-4xl">Klienci</h1>
        <p className="text-sm text-muted">Baza klientow z widokiem statusu sprzedazowego i follow-up.</p>
      </div>

      {editable ? (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-[var(--font-heading)] text-2xl">Dodaj klienta</h2>
            <AccountEnrichUrlButton />
          </div>
          <AccountCreateForm />
        </Card>
      ) : null}

      <AccountGroupsExplorer accounts={accounts ?? []} editable={editable} />
    </div>
  );
}
