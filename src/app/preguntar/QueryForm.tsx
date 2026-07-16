"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Answer = {
  answer: string;
  cited: { id: string; name: string }[];
};

export function QueryForm() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al consultar");
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder='Ej: "¿Cuándo compré creatina?"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          disabled={loading}
        />
        <Button onClick={ask} disabled={loading || !question.trim()}>
          {loading ? "..." : "Preguntar"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm leading-relaxed">{result.answer}</p>
          {result.cited.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
              <span>Basado en:</span>
              {result.cited.map((e) => (
                <Link key={e.id} href={`/entities/${e.id}`} className="underline underline-offset-2">
                  {e.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
