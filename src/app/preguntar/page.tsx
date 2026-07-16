import { QueryForm } from "./QueryForm";

export default function PreguntarPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Preguntar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cualquier cosa sobre tu vida que ya esté en el grafo.
      </p>
      <div className="mt-6">
        <QueryForm />
      </div>
    </div>
  );
}
