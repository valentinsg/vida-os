import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchUserRepos, normalizeForMatch } from "@/lib/integrations/github";
import type { Prisma } from "@/generated/prisma/client";

// Structural sync, not an LLM capture: GitHub already gives us typed,
// unambiguous data, so there's nothing for a model to infer here.
export async function POST() {
  const repos = await fetchUserRepos();

  const candidates = await db.entity.findMany({
    where: { type: { in: ["project", "company"] } },
    select: { id: true, name: true },
  });

  let created = 0;
  let updated = 0;
  let linked = 0;
  const unlinked: string[] = [];

  for (const repo of repos) {
    const properties = {
      githubId: repo.githubId,
      githubName: repo.name,
      url: repo.url,
      description: repo.description,
      pushedAt: repo.pushedAt,
      stars: repo.stars,
      openIssues: repo.openIssues,
      private: repo.private,
    } satisfies Prisma.InputJsonObject;

    // Match by GitHub's numeric id first — stable across renames on GitHub's
    // side. Fall back to name for entities synced before this field existed.
    const existing =
      (await db.entity.findFirst({
        where: { type: "repository", properties: { path: ["githubId"], equals: repo.githubId } },
      })) ?? (await db.entity.findFirst({ where: { type: "repository", name: repo.name } }));

    // Only set the display `name` on first creation. Once it exists, the
    // user may have renamed it in their own graph (an alias distinct from
    // whatever it's actually called on GitHub) — re-syncing must never
    // clobber that. `properties.githubName` above always has the real
    // current GitHub name for reference.
    const entity = existing
      ? await db.entity.update({ where: { id: existing.id }, data: { properties } })
      : await db.entity.create({ data: { type: "repository", name: repo.name, properties } });

    if (existing) updated++;
    else created++;

    const repoKey = normalizeForMatch(repo.name);
    const match = candidates.find((c) => {
      const candidateKey = normalizeForMatch(c.name);
      return repoKey === candidateKey || repoKey.includes(candidateKey) || candidateKey.includes(repoKey);
    });
    if (match) {
      const existingRel = await db.relationship.findFirst({
        where: { type: "has_repo", sourceId: match.id, targetId: entity.id },
      });
      if (!existingRel) {
        await db.relationship.create({
          data: { type: "has_repo", sourceId: match.id, targetId: entity.id, properties: {} },
        });
        linked++;
      }
    } else {
      unlinked.push(repo.name);
    }
  }

  return NextResponse.json({ synced: repos.length, created, updated, linked, unlinked });
}
