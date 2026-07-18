import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchUpcomingEvents } from "@/lib/integrations/google-calendar";
import type { Prisma } from "@/generated/prisma/client";

// Structural sync, same shape as the GitHub one: Calendar's API is already
// typed, nothing here needs the LLM.
export async function POST() {
  const events = await fetchUpcomingEvents(30);

  // Broader than the GitHub sync's project/company-only candidates —
  // a calendar event can plausibly mention a person, pet, or place by name
  // ("Turno Terry", "Cumpleaños Marina"), not just a project.
  const candidates = await db.entity.findMany({ select: { id: true, name: true } });

  let created = 0;
  let updated = 0;
  let mentioned = 0;

  for (const event of events) {
    const properties = {
      googleEventId: event.googleEventId,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      htmlLink: event.htmlLink,
    } satisfies Prisma.InputJsonObject;

    const existing = await db.entity.findFirst({
      where: { type: "event", properties: { path: ["googleEventId"], equals: event.googleEventId } },
    });

    // Same rule as GitHub: only set `name` on creation, never overwrite a
    // display name the user may have edited afterward.
    const entity = existing
      ? await db.entity.update({ where: { id: existing.id }, data: { properties } })
      : await db.entity.create({ data: { type: "event", name: event.summary, properties } });

    if (existing) updated++;
    else created++;

    const summaryLower = event.summary.toLowerCase();
    const mentions = candidates.filter((c) => c.name.length > 2 && summaryLower.includes(c.name.toLowerCase()));
    for (const m of mentions) {
      const existingRel = await db.relationship.findFirst({
        where: { type: "mentioned_in", sourceId: entity.id, targetId: m.id },
      });
      if (!existingRel) {
        await db.relationship.create({
          data: { type: "mentioned_in", sourceId: entity.id, targetId: m.id, properties: {} },
        });
        mentioned++;
      }
    }
  }

  return NextResponse.json({ synced: events.length, created, updated, mentioned });
}
