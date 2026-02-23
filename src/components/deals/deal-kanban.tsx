import { Card } from "@/components/ui/card";
import { currency } from "@/lib/format";
import { dealEventTypeLabel, dealStatusLabel } from "@/lib/i18n-pl";
import type { AppRole, DealEventType, DealStatus } from "@/lib/types";
import { DealStatusSelect } from "@/components/deals/deal-status-select";

export type DealKanbanRow = {
  id: string;
  event_type: string;
  estimated_value: number;
  status: string;
  probability: number;
  event_date: string | null;
  next_followup_date: string | null;
  accounts: { name: string } | null;
};

type DealKanbanProps = {
  deals: DealKanbanRow[];
  role: AppRole;
};

const columns = ["new_lead", "contacted", "offer_sent", "negotiation", "reserved", "lost"] as const;

export const DealKanban = ({ deals, role }: DealKanbanProps) => {
  const editable = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="grid gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {columns.map((status) => (
        <section key={status} className="space-y-3 2xl:min-w-[260px]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{dealStatusLabel(status)}</h3>
          {deals
            .filter((deal) => deal.status === status)
            .map((deal) => (
              <Card key={deal.id} className="space-y-3 p-4">
                <div>
                  <p className="font-medium">{deal.accounts?.name ?? "Nieznane konto"}</p>
                  <p className="text-xs text-muted">{dealEventTypeLabel(deal.event_type as DealEventType)}</p>
                </div>
                <p className="text-lg font-semibold">{currency(Number(deal.estimated_value || 0))}</p>
                <p className="text-xs text-muted">Prawdopodobieństwo: {deal.probability}%</p>
                <DealStatusSelect dealId={deal.id} value={deal.status as DealStatus} editable={editable} />
              </Card>
            ))}
        </section>
      ))}
    </div>
  );
};
