import { CalendarManager } from "@/components/calendar/calendar-manager";
import { Card } from "@/components/ui/card";
import { requireAnyRole } from "@/lib/auth";

export default async function EventsPage() {
  const user = await requireAnyRole(["ADMIN", "BOARD", "MANAGER", "STAFF"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[var(--font-heading)] text-4xl">Kalendarz</h1>
        <p className="text-sm text-muted">Dodawanie i podglad wydarzen zsynchronizowanych z Google Calendar.</p>
      </div>

      <Card>
        <h2 className="mb-3 font-[var(--font-heading)] text-2xl">Wydarzenia</h2>
        <CalendarManager role={user.role} />
      </Card>

      <Card>
        <h2 className="mb-2 font-[var(--font-heading)] text-2xl">Synchronizacja z iPhone</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Na iPhone dodaj to samo konto Google, ktore jest podpiete do kalendarza CRM.</li>
          <li>Ustawienia iPhone: Hasla i konta lub Kalendarz i wlacz synchronizacje kalendarzy Google.</li>
          <li>Nowe wydarzenia dodane tutaj pojawia sie automatycznie w aplikacji Kalendarz iPhone.</li>
        </ol>
      </Card>
    </div>
  );
}
