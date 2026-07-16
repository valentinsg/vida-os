import { CaptureForm } from "./CaptureForm";

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Capturar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Un tap para confirmar — nada se escribe en el grafo sin que lo apruebes.
      </p>
      <div className="mt-6">
        <CaptureForm />
      </div>
    </div>
  );
}
