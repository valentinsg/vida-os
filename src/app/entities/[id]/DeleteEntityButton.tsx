"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteEntityButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(`Borrar "${name}" y todas sus relaciones? Esto no se puede deshacer.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/entities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al borrar");
      router.push("/entities");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={remove} disabled={loading}>
      {loading ? "Borrando..." : "Borrar entidad"}
    </Button>
  );
}
