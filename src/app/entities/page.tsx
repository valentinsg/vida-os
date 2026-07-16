import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { GitHubSyncButton } from "./GitHubSyncButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function EntitiesPage() {
  const entities = await db.entity.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { outgoing: true, incoming: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Entidades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entities.length} nodos del grafo.
          </p>
        </div>
        <GitHubSyncButton />
      </div>

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Relaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <Link href={`/entities/${e.id}`} className="hover:underline">
                    {e.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{e.type}</Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {e._count.outgoing + e._count.incoming}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
