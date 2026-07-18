import { NextResponse } from "next/server";
import { getProximos, daysUntil, relativeLabel } from "@/lib/proximos";
import { sendWhatsAppMessage } from "@/lib/integrations/callmebot";

const SOON_WINDOW_DAYS = 14;

export function buildDailySummary(dated: Awaited<ReturnType<typeof getProximos>>["dated"], undatedCount: number): string {
  const soon = dated.filter((r) => daysUntil(r.date!) <= SOON_WINDOW_DAYS);
  const today = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" });

  if (soon.length === 0 && undatedCount === 0) {
    return `📋 Próximos (${today}): nada urgente por ahora.`;
  }

  const lines = soon.map((r) => `• ${r.name} — ${relativeLabel(daysUntil(r.date!))}`);
  let message = `📋 Próximos (${today}):\n${lines.join("\n")}`;
  if (undatedCount > 0) {
    message += `\n\n+ ${undatedCount} pendiente${undatedCount === 1 ? "" : "s"} sin fecha en /proximos`;
  }
  return message;
}

// Meant to be hit by a scheduler (cron, GitHub Actions, Task Scheduler) once
// the app has a real host — nothing here starts one itself. See ROADMAP.md.
export async function POST() {
  const { dated, undated } = await getProximos();
  const message = buildDailySummary(dated, undated.length);
  await sendWhatsAppMessage(message);
  return NextResponse.json({ sent: true, message });
}
