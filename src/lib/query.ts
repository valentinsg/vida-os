import { db } from "@/lib/db";
import { ai, withRetry } from "@/lib/llm";

export type QueryAnswer = {
  answer: string;
  citedEntityIds: string[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    citedEntityIds: {
      type: "array",
      items: { type: "string" },
      description: "ids of entities from the graph dump that the answer relies on",
    },
  },
  required: ["answer", "citedEntityIds"],
};

// Whole-graph-in-context, not vector retrieval: at hundreds of nodes the
// entire graph fits in a single prompt cheaper and more reliably than
// building/maintaining an embeddings index would be. Revisit once the graph
// outgrows a single context window (see graphify's own corpus-size check
// for the same judgment call, applied to this codebase).
export async function answerQuestion(question: string): Promise<QueryAnswer> {
  const [entities, relationships] = await Promise.all([
    db.entity.findMany({ select: { id: true, type: true, name: true, properties: true } }),
    db.relationship.findMany({ select: { id: true, type: true, sourceId: true, targetId: true, properties: true } }),
  ]);

  const entityLines = entities
    .map((e) => `${e.id} | ${e.type} | ${e.name} | ${JSON.stringify(e.properties)}`)
    .join("\n");
  const relationshipLines = relationships
    .map((r) => `${r.sourceId} --${r.type}--> ${r.targetId} | ${JSON.stringify(r.properties)}`)
    .join("\n");

  const prompt = `You answer questions about Valentín's life using ONLY the graph data below — his life is modeled as entities (people, projects, pets, purchases, debts...) connected by relationships. Answer in Spanish, conversationally, the way a person who actually knows this context would — not a database dump.

If the graph doesn't contain enough to answer, say so plainly instead of guessing. Never invent a fact that isn't in the data below.

ENTITIES (id | type | name | properties):
${entityLines}

RELATIONSHIPS (source --type--> target | properties):
${relationshipLines}

Question: "${question}"`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
      },
    })
  );

  const text = response.text;
  if (!text) throw new Error("Gemini returned no content for query answer");

  return JSON.parse(text) as QueryAnswer;
}
