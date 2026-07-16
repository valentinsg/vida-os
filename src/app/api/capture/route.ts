import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposeCapture } from "@/lib/llm";
import type { Prisma } from "@/generated/prisma/client";

// Step 1 of tap-to-confirm: raw text in, LLM proposal staged in Capture.
// Nothing lands in Entity/Relationship until POST /api/capture/[id] confirms it.
export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const existingEntities = await db.entity.findMany({
    select: { id: true, type: true, name: true },
  });

  const proposal = await proposeCapture(text, existingEntities);

  const capture = await db.capture.create({
    data: {
      rawText: text,
      status: "pending",
      proposedEntities: proposal.entities as unknown as Prisma.InputJsonValue,
      proposedRelationships: proposal.relationships as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(capture, { status: 201 });
}

export async function GET() {
  const captures = await db.capture.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(captures);
}
