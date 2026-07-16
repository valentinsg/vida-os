import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ProposedEntity, ProposedRelationship } from "@/lib/llm";

// Step 2 of tap-to-confirm. `entities`/`relationships` in the body are the
// user's edited version of the proposal (renamed, dropped, reassigned type);
// omit them to accept the LLM's proposal as-is.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const capture = await db.capture.findUnique({ where: { id } });
  if (!capture) return NextResponse.json({ error: "capture not found" }, { status: 404 });
  if (capture.status !== "pending") {
    return NextResponse.json({ error: `capture is already ${capture.status}` }, { status: 409 });
  }

  if (body.action === "reject") {
    const updated = await db.capture.update({ where: { id }, data: { status: "rejected" } });
    return NextResponse.json(updated);
  }

  if (body.action !== "confirm") {
    return NextResponse.json({ error: "action must be 'confirm' or 'reject'" }, { status: 400 });
  }

  const entities: ProposedEntity[] = body.entities ?? (capture.proposedEntities as unknown as ProposedEntity[]);
  const relationships: ProposedRelationship[] =
    body.relationships ?? (capture.proposedRelationships as unknown as ProposedRelationship[]);
  const wasEdited = Boolean(body.entities || body.relationships);

  const result = await db.$transaction(async (tx) => {
    const tempIdToRealId = new Map<string, string>();

    for (const e of entities) {
      if (e.reuseExistingId) {
        tempIdToRealId.set(e.tempId, e.reuseExistingId);
        continue;
      }
      const created = await tx.entity.create({
        data: { type: e.type, name: e.name, properties: e.properties as Prisma.InputJsonValue },
      });
      tempIdToRealId.set(e.tempId, created.id);
    }

    const resolve = (ref: string) => tempIdToRealId.get(ref) ?? ref; // falls back to a literal existing-entity id

    const createdRelationships = [];
    for (const r of relationships) {
      createdRelationships.push(
        await tx.relationship.create({
          data: {
            type: r.type,
            sourceId: resolve(r.source),
            targetId: resolve(r.target),
            properties: r.properties as Prisma.InputJsonValue,
          },
        })
      );
    }

    const updatedCapture = await tx.capture.update({
      where: { id },
      data: { status: wasEdited ? "edited" : "confirmed", confirmedAt: new Date() },
    });

    return { capture: updatedCapture, entityCount: tempIdToRealId.size, relationships: createdRelationships };
  });

  return NextResponse.json(result);
}
