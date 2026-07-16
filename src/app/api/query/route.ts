import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { answerQuestion } from "@/lib/query";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const result = await answerQuestion(question);
  const cited = await db.entity.findMany({
    where: { id: { in: result.citedEntityIds } },
    select: { id: true, name: true },
  });

  return NextResponse.json({ answer: result.answer, cited });
}
