import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getProximos, daysUntil, relativeLabel } from "@/lib/proximos";

export const dynamic = "force-dynamic";

export default async function ProximosPage() {
  const { dated, undated } = await getProximos();

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
