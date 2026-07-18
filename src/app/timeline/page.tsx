import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import type { ProposedEntity } from "@/lib/llm";

export const dynamic = "force-dynamic";

function formatDay(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default async function TimelinePage() {
  const captures = await db.capture.findMany({
    where: { status: { in: ["confirmed", "edited"] } },
    orderBy: { confirmedAt: "desc" },
  });

  const groups: { day: string; items: typeof captures }[] = [];
  for (const c of captures) {
    const day = formatDay(c.confirmedAt ?? c.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(c);
    else groups.push({ day, items: [c] });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Timeline</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Todo lo que capturaste, en orden — el historial de tu grafo.
      </p>

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.day}>
            <h2 className="text-sm font-medium text-muted-foreground">{group.day}</h2>
            <div className="mt-3 space-y-3 border-l pl-4">
              {group.items.map((c) => {
                const entities = c.proposedEntities as unknown as ProposedEntity[];
                return (
                  <div key={c.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <p className="text-sm">{c.rawText}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(c.confirmedAt ?? c.createdAt)}
                      </span>
                      {entities.map((e) => (
                        <Badge key={e.tempId} variant="outline" className="text-[10px]">
                          {e.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay nada capturado.</p>
        )}
      </div>
    </div>
  );
}
