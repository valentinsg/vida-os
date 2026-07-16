import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type ProposedEntity = {
  tempId: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
  reuseExistingId: string | null;
};

export type ProposedRelationship = {
  type: string;
  source: string; // tempId of a proposed entity, or an existing Entity id
  target: string;
  properties: Record<string, unknown>;
};

export type CaptureProposal = {
  entities: ProposedEntity[];
  relationships: ProposedRelationship[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tempId: { type: "string", description: "Local id used to reference this entity from relationships in this same proposal." },
          type: { type: "string" },
          name: { type: "string" },
          properties: { type: "object" },
          reuseExistingId: {
            type: ["string", "null"],
            description: "Set to an id from the existing-entities list if this is the same real-world thing, instead of creating a duplicate.",
          },
        },
        required: ["tempId", "type", "name", "properties", "reuseExistingId"],
      },
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          source: { type: "string", description: "A tempId from entities[], or an existing entity id." },
          target: { type: "string", description: "A tempId from entities[], or an existing entity id." },
          properties: { type: "object" },
        },
        required: ["type", "source", "target", "properties"],
      },
    },
  },
  required: ["entities", "relationships"],
};

// Known vocabulary is a *guide*, not a fixed enum — see AGENTS.md. The model
// may introduce a new type when nothing existing fits.
const KNOWN_ENTITY_TYPES = [
  "person", "pet", "project", "company", "house", "vehicle", "debt",
  "subscription", "expense", "supplement", "habit", "reminder", "goal",
  "wishlist_item", "game", "movie", "book", "place", "trip", "gym_routine", "purchase",
];
const KNOWN_RELATIONSHIP_TYPES = [
  "works_at", "client_of", "partner_in", "friend_of", "family_of", "owns",
  "inherited_from", "lives_at", "part_of", "developed_by", "collaborates_on",
  "uses", "wants", "scheduled_for", "located_in", "visited", "plays_with",
  "inspired_by", "paid_via", "linked_to",
];

export async function proposeCapture(
  rawText: string,
  existingEntities: { id: string; type: string; name: string }[]
): Promise<CaptureProposal> {
  const prompt = `You extract entities and relationships from a short piece of text describing an event in Valentín's life, for a personal life-graph app.

Known entity types (prefer these, invent a new one only if nothing fits): ${KNOWN_ENTITY_TYPES.join(", ")}
Known relationship types (same rule): ${KNOWN_RELATIONSHIP_TYPES.join(", ")}

Existing entities you may reuse instead of creating duplicates (id | type | name):
${existingEntities.map((e) => `${e.id} | ${e.type} | ${e.name}`).join("\n")}

Rules:
- If the text refers to something already in the existing-entities list, set reuseExistingId to that id and still include the entity in your output (so relationships can reference it by tempId), but don't invent new properties that contradict what's already known.
- Create new entities for anything genuinely new.
- A single sentence typically implies multiple relationships across different life domains (e.g. a purchase can touch health, a hobby, and a budget at once) — don't just extract the literal subject/object, extract the second-order connections too.
- Keep entity names short and human ("Creatina", not "Compra de creatina en el supermercado").

Text: "${rawText}"`;

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
  if (!text) throw new Error("Gemini returned no content for capture proposal");

  return JSON.parse(text) as CaptureProposal;
}

// The free tier throws transient 503s ("high demand") and occasional raw
// socket resets under load — both routinely recover within a few seconds,
// so failing the user's capture on the first hiccup would be needless.
function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 503 || status === 429) return true;
  const code = (err as { cause?: { code?: string } })?.cause?.code;
  return code === "UND_ERR_SOCKET" || code === "ECONNRESET";
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts || !isTransient(err)) throw err;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 500));
    }
  }
}
