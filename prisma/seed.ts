// Seed with real entities from Valentín's life, not placeholder data.
// Purpose: prove the two-table graph model actually holds the cross-domain
// chains it's meant for (see CLAUDE.md, "why this shape") before any UI exists.
import { PrismaClient, Prisma } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Slug = string;
const ids: Record<Slug, string> = {};

async function entity(slug: Slug, type: string, name: string, properties: Record<string, unknown> = {}) {
  const row = await prisma.entity.create({
    data: { type, name, properties: properties as Prisma.InputJsonValue },
  });
  ids[slug] = row.id;
  return row;
}

async function rel(type: string, source: Slug, target: Slug, properties: Record<string, unknown> = {}) {
  return prisma.relationship.create({
    data: { type, sourceId: ids[source], targetId: ids[target], properties: properties as Prisma.InputJsonValue },
  });
}

async function main() {
  // --- People ---
  await entity("valentin", "person", "Valentín", { isSelf: true, role: "programador" });
  await entity("dana", "person", "Dana");
  await entity("marina", "person", "Marina");
  await entity("camila", "person", "Camila");
  await entity("mauro", "person", "Mauro");
  await entity("juampi", "person", "Juampi");
  await entity("inaki", "person", "Iñaki");
  await entity("alan", "person", "Alan");
  await entity("mancho", "person", "Mancho");
  await entity("valentino", "person", "Valentino", { profession: "periodista" });
  await entity("roque", "person", "Roque");
  await entity("marce", "person", "Marce");
  await entity("jesus", "person", "Jesús");
  await entity("jorge", "person", "Jorge", { nationality: "español" });

  await rel("in_progress_with", "valentin", "dana");
  await rel("family_of", "marina", "valentin", { relation: "madre" });
  await rel("family_of", "camila", "valentin", { relation: "hermana" });
  await rel("family_of", "mauro", "valentin", { relation: "hermano" });
  await rel("friend_of", "juampi", "valentin", { closeness: "alto" });
  await rel("friend_of", "inaki", "valentin", { closeness: "alto" });
  await rel("friend_of", "alan", "valentin", { closeness: "alto" });
  await rel("friend_of", "mancho", "valentin", { closeness: "medio" });
  await rel("friend_of", "valentino", "valentin", { closeness: "medio" });

  // --- Companies / projects ---
  await entity("estudio_ve", "company", "Estudio VE", { kind: "own_business" });
  await entity("mistock", "project", "Mi Stock", { status: "active" });
  await entity("presidencial", "project", "Presidencial", { status: "active", color: "violeta" });
  await entity("pelotita", "project", "Pelotita", { status: "active", kind: "sideproject" });
  await entity("abundancia", "company", "Abundancia", { kind: "client", note: "trabajo oficial" });
  await entity("avisalud", "company", "Avi Salud", { kind: "client" });
  await entity("smithii", "company", "Smithii", { kind: "past_client", status: "archived" });

  await rel("partner_in", "valentin", "estudio_ve", { role: "socio" });
  await rel("partner_in", "roque", "estudio_ve", { role: "socio" });
  await rel("part_of", "mistock", "estudio_ve");
  await rel("part_of", "presidencial", "estudio_ve");
  await rel("developed_by", "presidencial", "valentin");
  await rel("collaborates_on", "valentino", "pelotita");
  await rel("client_of", "abundancia", "valentin");
  await rel("client_of", "avisalud", "valentin");
  await rel("owns", "marce", "avisalud");
  await rel("owns", "jesus", "avisalud");
  await rel("client_of", "smithii", "valentin", { status: "archived" });
  await rel("owns", "jorge", "smithii");
  await rel("friend_of", "jorge", "valentin", { note: "se distanció cuando volvió con la novia" });

  // --- Games / library, feeding Presidencial's design ---
  await entity("saints_row_3", "game", "Saints Row 3", { status: "completed" });
  await entity("skyrim", "game", "Skyrim", { status: "completed" });
  await entity("gta5", "game", "GTA V", { status: "completed" });
  await entity("state_of_decay_2", "game", "State of Decay 2", { status: "playing" });

  await rel("inspired_by", "presidencial", "saints_row_3");
  await rel("inspired_by", "presidencial", "skyrim");
  await rel("inspired_by", "presidencial", "gta5");
  await rel("plays_with", "valentin", "state_of_decay_2");
  await rel("plays_with", "juampi", "state_of_decay_2");

  // --- House, inherited from grandmother, decor inspired by Presidencial ---
  await entity("depto", "house", "Depto María Curie 5457", {
    address: "María Curie 5457, Barrio Zacagnini, Mar del Plata",
    ownership: "heredado, pendiente escrituración",
  });
  await entity("deuda_expensas", "debt", "Deuda de expensas heredada", { monthlyApprox: 150000, currency: "ARS" });
  await entity("escrituracion", "reminder", "Escriturar el depto a mi nombre", { status: "pending" });

  await rel("inherited_from", "depto", "valentin", { note: "herencia de la abuela" });
  await rel("inspired_by", "depto", "presidencial", { note: "pintar el mismo violeta" });
  await rel("owes", "valentin", "deuda_expensas");
  await rel("linked_to", "deuda_expensas", "depto");
  await rel("scheduled_for", "escrituracion", "depto");

  // --- Vehicle, inherited from father ---
  await entity("ford_ka", "vehicle", "Ford Ka 2000", { status: "reconstruction" });
  await rel("inherited_from", "ford_ka", "valentin", { note: "herencia del papá" });

  // --- Pets ---
  await entity("terry", "pet", "Terry", { species: "gato", birthdate: "2026-03-07" });
  await entity("gordo", "pet", "Gordo", { species: "gato", birthdate: "2026-03-07" });
  await entity("vacuna_gatos", "reminder", "Vacuna Terry y Gordo", { targetDate: "2026-09-07", status: "pending" });
  await entity("castracion_gatos", "reminder", "Castración Terry y Gordo", { targetDate: "2026-09-07", status: "pending" });
  await entity("pulgas_gatos", "reminder", "Tratamiento de pulgas", { status: "pending", urgency: "now" });

  for (const pet of ["terry", "gordo"]) {
    await rel("owns", "valentin", pet);
    await rel("scheduled_for", "vacuna_gatos", pet);
    await rel("scheduled_for", "castracion_gatos", pet);
    await rel("scheduled_for", "pulgas_gatos", pet);
  }

  // --- Health / gym ---
  await entity("gimnasio", "habit", "Rutina de gimnasio", { split: "cadena posterior / cadena anterior", goal: "volumen" });
  await entity("creatina", "supplement", "Creatina", { status: "retomando" });
  await entity("star_colageno", "supplement", "Star Colágeno Neer Formula");
  await entity("megacistin", "supplement", "Megacistin", { purpose: "alopecia" });
  await rel("uses", "valentin", "gimnasio");
  await rel("uses", "valentin", "creatina");
  await rel("uses", "valentin", "star_colageno");
  await rel("uses", "valentin", "megacistin");

  // --- Wishlist ---
  await entity("ryzen", "wishlist_item", "Cambiar el procesador (Ryzen)");
  await entity("armaf", "wishlist_item", "Perfume Armaf Club de Nuit");
  await rel("wants", "valentin", "ryzen");
  await rel("wants", "valentin", "armaf");

  // --- Trip ---
  await entity("patagonia_2024", "trip", "Patagonia 2024", { withCompany: "smithii" });
  await rel("visited", "valentin", "patagonia_2024");
  await rel("linked_to", "patagonia_2024", "smithii");
  await rel("linked_to", "patagonia_2024", "jorge");

  console.log(`Seeded ${Object.keys(ids).length} entities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
