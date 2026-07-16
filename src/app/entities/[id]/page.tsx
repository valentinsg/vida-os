import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { EntityEditForm } from "./EntityEditForm";

export const dynamic = "force-dynamic";

export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await db.entity.findUnique({
    where: { id },
    include: {
      outgoing: { include: { target: true } },
      incoming: { include: { source: true } },
    },
  });
  if (!entity) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/entities" className="text-sm text-muted-foreground hover:text-foreground">
        ← Entidades
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{entity.name}</h1>
        <Badge variant="secondary">{entity.type}</Badge>
      </div>

      <div className="mt-4">
        <EntityEditForm id={entity.id} name={entity.name} properties={entity.properties} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">
          Relaciones salientes ({entity.outgoing.length})
        </h2>
        <ul className="mt-2 space-y-1">
          {entity.outgoing.map((r) => (
            <li key={r.id} className="text-sm">
              <span className="text-muted-foreground">{r.type}</span>{" "}
              <Link href={`/entities/${r.target.id}`} className="underline underline-offset-2">
                {r.target.name}
              </Link>
            </li>
          ))}
          {entity.outgoing.length === 0 && (
            <li className="text-sm text-muted-foreground">Ninguna.</li>
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Relaciones entrantes ({entity.incoming.length})
        </h2>
        <ul className="mt-2 space-y-1">
          {entity.incoming.map((r) => (
            <li key={r.id} className="text-sm">
              <Link href={`/entities/${r.source.id}`} className="underline underline-offset-2">
                {r.source.name}
              </Link>{" "}
              <span className="text-muted-foreground">{r.type}</span>{" "}
              <span className="text-muted-foreground">esto</span>
            </li>
          ))}
          {entity.incoming.length === 0 && (
            <li className="text-sm text-muted-foreground">Ninguna.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
