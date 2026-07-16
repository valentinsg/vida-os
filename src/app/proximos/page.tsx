import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Row = {
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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function relativeLabel(days: number): string {
  if (days < 0) return `vencido hace ${-days} día${-days === 1 ? "" : "s"}`;
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

export default async function ProximosPage() {
  const entities = await db.entity.findMany({
    include: {
      outgoing: { include: { target: true } },
      incoming: { include: { source: true } },
    },
  });

  const rows: Row[] = entities
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Próximos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Lo que tu grafo sabe que se viene.</p>

      <section className="mt-6 space-y-3">
        {dated.map((r) => {
          const days = daysUntil(r.date!);
          return (
            <div key={r.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <Link href={`/entities/${r.id}`} className="text-sm font-medium hover:underline">
                  {r.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">
                    {r.type}
                  </Badge>
                  {r.related.map((rel) => (
                    <Link key={rel.id} href={`/entities/${rel.id}`} className="underline underline-offset-2">
                      {rel.name}
                    </Link>
                  ))}
                </div>
              </div>
              <span className={`shrink-0 text-xs ${days < 0 ? "text-destructive" : days <= 7 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {relativeLabel(days)}
              </span>
            </div>
          );
        })}
        {dated.length === 0 && <p className="text-sm text-muted-foreground">Nada con fecha por ahora.</p>}
      </section>

      {undated.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Pendientes sin fecha</h2>
          <div className="mt-3 space-y-2">
            {undated.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
                <Link href={`/entities/${r.id}`} className="text-sm hover:underline">
                  {r.name}
                </Link>
                <Badge variant="outline" className="text-[10px]">
                  {r.type}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
