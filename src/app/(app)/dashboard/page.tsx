import Link from "next/link";

import { InteractionTimeline } from "@/components/sales/interaction-timeline";
import { TemplateManager } from "@/components/sales/template-manager";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { requireAnyRole } from "@/lib/auth";
import { salesStatusLabel } from "@/lib/i18n-pl";
import { getAccountsForSeller, getInteractionsWithAccounts, getMessageTemplates, getReminderTasks, getSellerKpis } from "@/lib/seller-queries";
import type { SalesStatus } from "@/lib/types";

export default async function DashboardPage() {
  const user = await requireAnyRole(["ADMIN", "BOARD", "MANAGER", "STAFF"]);
  const canEditSales = user.role === "ADMIN" || user.role === "MANAGER";
  const hasSalesAccess = user.role === "ADMIN" || user.role === "BOARD" || user.role === "MANAGER";

  if (!hasSalesAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl">Panel</h1>
          <p className="text-sm text-muted">Dla tej roli dostepny jest glownie kalendarz wydarzen.</p>
        </div>
        <Card>
          <h2 className="font-[var(--font-heading)] text-xl sm:text-2xl">Kalendarz</h2>
          <p className="mt-2 text-sm text-muted">Przejdz do kalendarza, aby sprawdzic i dodawac wydarzenia.</p>
          <Link
            href="/events"
            className="mt-4 inline-block rounded-md border border-line bg-black/20 px-4 py-2 text-sm hover:border-accent hover:text-[#fcf8f0]"
          >
            Otworz kalendarz
          </Link>
        </Card>
      </div>
    );
  }

  const [kpis, tasks, accounts, timeline, templates] = await Promise.all([
    getSellerKpis(),
    getReminderTasks(),
    getAccountsForSeller(user.role),
    getInteractionsWithAccounts(),
    getMessageTemplates()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-3xl sm:text-4xl">Panel sprzedawcy</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Nowi klienci (tydzien)" value={String(kpis.newThisWeek)} />
        <StatCard label="Wyslane oferty" value={String(kpis.offersSent)} />
        <StatCard label="Zrealizowane" value={String(kpis.completed)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-[var(--font-heading)] text-xl sm:text-2xl">Dzisiaj do zrobienia</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Po terminie</p>
              <ul className="space-y-2 text-sm">
                {tasks.overdue.length ? (
                  tasks.overdue.map((task) => (
                    <li key={task.id} className="rounded-md border border-line bg-black/25 px-3 py-2">
                      {task.name} ({salesStatusLabel(task.sales_status as SalesStatus)}) - {task.next_followup_date}
                    </li>
                  ))
                ) : (
                  <li className="text-muted">Brak zaleglych follow-upow.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Na dzis</p>
              <ul className="space-y-2 text-sm">
                {tasks.today.length ? (
                  tasks.today.map((task) => (
                    <li key={task.id} className="rounded-md border border-line bg-black/25 px-3 py-2">
                      {task.name} ({salesStatusLabel(task.sales_status as SalesStatus)})
                    </li>
                  ))
                ) : (
                  <li className="text-muted">Brak follow-upow na dzis.</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-[var(--font-heading)] text-xl sm:text-2xl">Szybkie przejscie</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/accounts"
              className="inline-block rounded-md border border-line bg-black/20 px-4 py-2 text-sm hover:border-accent hover:text-[#fcf8f0]"
            >
              Klienci
            </Link>
            <Link
              href="/events"
              className="inline-block rounded-md border border-line bg-black/20 px-4 py-2 text-sm hover:border-accent hover:text-[#fcf8f0]"
            >
              Kalendarz
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-[var(--font-heading)] text-xl sm:text-2xl">Timeline kontaktu</h2>
          <InteractionTimeline
            accounts={accounts.map((row) => ({ id: row.id, name: row.name }))}
            templates={templates.map((row) => ({ id: row.id, title: row.title, content: row.content }))}
            timeline={timeline}
            editable={canEditSales}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-[var(--font-heading)] text-xl sm:text-2xl">Szablony wiadomosci i ofert</h2>
          <TemplateManager
            templates={templates.map((row) => ({ id: row.id, title: row.title, type: row.type, content: row.content }))}
            editable={canEditSales}
          />
        </Card>
      </section>
    </div>
  );
}
