import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = await db.entity.findUnique({
    where: { id },
    include: {
      outgoing: { include: { target: true } },
      incoming: { include: { source: true } },
    },
  });
  if (!entity) return NextResponse.json({ error: "entity not found" }, { status: 404 });
  return NextResponse.json(entity);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Prisma.EntityUpdateInput = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.type === "string") data.type = body.type;
  if (body.properties && typeof body.properties === "object") {
    data.properties = body.properties as Prisma.InputJsonValue;
  }

  const updated = await db.entity.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // onDelete: Cascade on Relationship.source/target drops its edges too.
  await db.entity.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
