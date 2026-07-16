"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  const [draftEntities, setDraftEntities] = useState<ProposedEntity[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmedMsg, setConfirmedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (ref: string) => draftEntities.find((e) => e.tempId === ref)?.name ?? ref;

  const visibleRelationships =
    capture?.proposedRelationships.filter((r) => !excluded.has(r.source) && !excluded.has(r.target)) ?? [];

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
      const data: Capture = await res.json();
      setCapture(data);
      setDraftEntities(data.proposedEntities);
      setExcluded(new Set());
      setEditing(false);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function updateEntity(tempId: string, field: "name" | "type", value: string) {
    setDraftEntities((prev) => prev.map((e) => (e.tempId === tempId ? { ...e, [field]: value } : e)));
    setDirty(true);
  }

  function toggleExclude(tempId: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
    setDirty(true);
  }

  async function respond(action: "confirm" | "reject") {
    if (!capture) return;
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "confirm" && dirty) {
        body.entities = draftEntities.filter((e) => !excluded.has(e.tempId));
        body.relationships = visibleRelationships;
      }
      const res = await fetch(`/api/capture/${capture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al confirmar");
      setConfirmedMsg(action === "confirm" ? "Escrito en el grafo." : "Descartado.");
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Esto entendí</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
              {editing ? "Listo" : "Editar"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {draftEntities.map((e) => {
                const isExcluded = excluded.has(e.tempId);
                return (
                  <div key={e.tempId} className={`flex items-center gap-2 text-sm ${isExcluded ? "opacity-40" : ""}`}>
                    {editing ? (
                      <>
                        <Input
                          value={e.type}
                          onChange={(ev) => updateEntity(e.tempId, "type", ev.target.value)}
                          className="h-7 w-28 text-xs"
                          disabled={isExcluded}
                        />
                        <Input
                          value={e.name}
                          onChange={(ev) => updateEntity(e.tempId, "name", ev.target.value)}
                          className="h-7 flex-1 text-xs"
                          disabled={isExcluded}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toggleExclude(e.tempId)}
                        >
                          {isExcluded ? "Incluir" : "Quitar"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant={e.reuseExistingId ? "outline" : "secondary"}>{e.type}</Badge>
                        <span>{e.name}</span>
                        {e.reuseExistingId && (
                          <span className="text-xs text-muted-foreground">(existente)</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="space-y-1 border-t pt-3 text-sm text-muted-foreground">
              {visibleRelationships.map((r, i) => (
                <div key={i}>
                  {nameOf(r.source)} <span className="text-foreground">{r.type}</span> {nameOf(r.target)}
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
