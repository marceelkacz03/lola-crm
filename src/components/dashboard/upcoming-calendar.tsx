import { eachDayOfInterval, endOfMonth, format, getDay, isSameDay, startOfMonth } from "date-fns";
import { pl } from "date-fns/locale";

import { Card } from "@/components/ui/card";

type UpcomingEvent = {
  id: string;
  event_date: string;
  hall: string;
  number_of_guests: number;
};

type UpcomingCalendarProps = {
  events: UpcomingEvent[];
};

const weekdays = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

export const UpcomingCalendar = ({ events }: UpcomingCalendarProps) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmptyCells = getDay(monthStart);

  return (
    <Card>
      <h2 className="font-[var(--font-heading)] text-2xl">Kalendarz nadchodzących wydarzeń</h2>
      <p className="mb-4 text-xs text-muted">{format(monthStart, "LLLL yyyy", { locale: pl })}</p>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wide text-muted">
            {weekdays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: leadingEmptyCells }).map((_, index) => (
              <div key={`empty-${index}`} className="h-20 rounded-md border border-line/50 bg-black/20" />
            ))}
            {days.map((day) => {
              const dayEvents = events.filter((event) => isSameDay(new Date(event.event_date), day));
              return (
                <div key={day.toISOString()} className="h-20 overflow-hidden rounded-md border border-line bg-black/25 p-2">
                  <p className="text-xs font-semibold">{format(day, "d")}</p>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <p key={event.id} className="truncate text-[10px] text-muted">
                        {event.hall} ({event.number_of_guests})
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
