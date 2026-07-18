"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const FORMATTERS: Record<string, (d: Record<string, number>) => string> = {
  github: (d) => `${d.synced} repos (${d.created} nuevos, ${d.linked} vinculados)`,
  calendar: (d) => `${d.synced} eventos (${d.created} nuevos, ${d.mentioned} menciones)`,
};

export function SyncButton({
  endpoint,
  label,
  kind,
}: {
  endpoint: string;
  label: string;
  kind: keyof typeof FORMATTERS;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al sincronizar");
      setMessage(FORMATTERS[kind](data));
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={sync} disabled={loading}>
        {loading ? "Sincronizando..." : label}
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}
