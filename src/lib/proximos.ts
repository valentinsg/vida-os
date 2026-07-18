import { db } from "@/lib/db";

export type ProximoRow = {
  id: string;
  name: string;
  type: string;
  date: string | null;
  related: { id: string; name: string }[];
};

function getDate(properties: unknown): string | null {
  if (!properties || typeof properties !== "object") return null;
  const p = properties as Record<string, unknown>;
  const raw = p.targetDate ?? p.dueDate;
  return typeof raw === "string" ? raw : null;
}

function isPending(properties: unknown): boolean {
  if (!properties || typeof properties !== "object") return false;
  return (properties as Record<string, unknown>).status === "pending";
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function relativeLabel(days: number): string {
  if (days < 0) return `vencido hace ${-days} día${-days === 1 ? "" : "s"}`;
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

export async function getProximos(): Promise<{ dated: ProximoRow[]; undated: ProximoRow[] }> {
  const entities = await db.entity.findMany({
    include: {
      outgoing: { include: { target: true } },
      incoming: { include: { source: true } },
    },
  });

  const rows: ProximoRow[] = entities
    .filter((e) => getDate(e.properties) || (isPending(e.properties) && (e.type === "reminder" || e.type === "debt")))
    .map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      date: getDate(e.properties),
      related: [
        ...e.outgoing.map((r) => ({ id: r.target.id, name: r.target.name })),
        ...e.incoming.map((r) => ({ id: r.source.id, name: r.source.name })),
      ],
    }));

  const dated = rows.filter((r) => r.date).sort((a, b) => (a.date! < b.date! ? -1 : 1));
  const undated = rows.filter((r) => !r.date);
  return { dated, undated };
}
