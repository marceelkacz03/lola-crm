import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  note?: string;
};

export const StatCard = ({ label, value, note }: StatCardProps) => (
  <Card>
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-2 font-[var(--font-heading)] text-3xl">{value}</p>
    {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
  </Card>
);
