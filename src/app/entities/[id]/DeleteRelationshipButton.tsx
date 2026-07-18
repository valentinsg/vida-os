"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteRelationshipButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/relationships/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al borrar");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
      title="Borrar relación"
      aria-label="Borrar relación"
    >
      ×
    </button>
  );
}
