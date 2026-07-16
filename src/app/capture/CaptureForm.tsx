"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProposedEntity, ProposedRelationship } from "@/lib/llm";

type Capture = {
  id: string;
  rawText: string;
  status: string;
  proposedEntities: ProposedEntity[];
  proposedRelationships: ProposedRelationship[];
};

export function CaptureForm() {
  const [text, setText] = useState("");
  const [capture, setCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (entities: ProposedEntity[], ref: string) =>
    entities.find((e) => e.tempId === ref)?.name ?? ref;

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setConfirmedMsg(null);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al capturar");
      setCapture(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function respond(action: "confirm" | "reject") {
    if (!capture) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/capture/${capture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al confirmar");
      setConfirmedMsg(
        action === "confirm" ? "Escrito en el grafo." : "Descartado."
      );
      setCapture(null);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder='Ej: "Compré creatina"'
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading || !!capture}
        rows={3}
      />
      {!capture && (
        <Button onClick={submit} disabled={loading || !text.trim()}>
          {loading ? "Pensando..." : "Capturar"}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {confirmedMsg && <p className="text-sm text-muted-foreground">{confirmedMsg}</p>}

      {capture && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Esto entendí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {capture.proposedEntities.map((e) => (
                <div key={e.tempId} className="flex items-center gap-2 text-sm">
                  <Badge variant={e.reuseExistingId ? "outline" : "secondary"}>
                    {e.type}
                  </Badge>
                  <span>{e.name}</span>
                  {e.reuseExistingId && (
                    <span className="text-xs text-muted-foreground">(existente)</span>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t pt-3 text-sm text-muted-foreground">
              {capture.proposedRelationships.map((r, i) => (
                <div key={i}>
                  {nameOf(capture.proposedEntities, r.source)}{" "}
                  <span className="text-foreground">{r.type}</span>{" "}
                  {nameOf(capture.proposedEntities, r.target)}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => respond("confirm")} disabled={loading}>
                Confirmar
              </Button>
              <Button variant="outline" onClick={() => respond("reject")} disabled={loading}>
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
