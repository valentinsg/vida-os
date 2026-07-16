"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  id: string;
  name: string;
  properties: unknown;
};

export function EntityEditForm({ id, name, properties }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [propertiesValue, setPropertiesValue] = useState(JSON.stringify(properties, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    let parsedProperties: unknown;
    try {
      parsedProperties = JSON.parse(propertiesValue);
    } catch {
      setError("Las propiedades tienen que ser JSON válido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/entities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue, properties: parsedProperties }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Editar
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <label className="text-xs text-muted-foreground">Nombre</label>
        <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Propiedades (JSON)</label>
        <Textarea
          className="font-mono text-xs"
          rows={8}
          value={propertiesValue}
          onChange={(e) => setPropertiesValue(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
