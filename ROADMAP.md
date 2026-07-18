# Roadmap — vida-os

> Última actualización: 2026-07-18. Documento vivo — se actualiza al final de cada sesión de trabajo.
> El documento de producto completo (visión, objeciones, arquitectura) está publicado como artifact de Claude; pedirle el link a Valentín si hace falta.
> **Repo**: https://github.com/valentinsg/vida-os (migrado el 2026-07-18 desde `abundancia33/vida-os`, que ya está borrado — Valentín no lo quería en esa cuenta).

## Estado actual (lo que ya funciona)

- **Modelo de grafo**: `Entity` + `Relationship` + `Capture` en Postgres/Prisma, tipos de vocabulario abierto. Seed con datos reales de la vida de Valentín (41 entidades) + ~66 repos sincronizados de GitHub.
- **Captura tap-to-confirm** (`/capture`): texto libre → Gemini propone entidades/relaciones → confirmás, editás (renombrar, cambiar tipo, quitar entidades) o descartás. Probado end-to-end con "Compré creatina" y con un caso editado ("Pagué el gym").
- **Consulta en lenguaje natural** (`/preguntar`): grafo completo en contexto, responde con citas a entidades. Probado con las preguntas del pitch original.
- **Próximos** (`/proximos`): recordatorios y vencimientos ordenados por fecha (vacuna gatos, deuda expensas con vencimiento 20/07).
- **Entidades** (`/entities`): lista con filtro por tipo, detalle con relaciones navegables, edición inline de nombre/propiedades, y borrado (de la entidad completa o de una relación puntual, con confirmación).
- **GitHub sync** (botón en `/entities`): trae repos de `valentinsg` (66 repos) y los vincula a proyectos por nombre — **resuelto**, Estudio VE, Mi Stock, Presidencial, Pelotita y Avi Salud ya están todos linkeados.
- **graphify**: el código del proyecto está indexado en `graphify-out/` (consultar el grafo antes de releer archivos en frío). Desactualizado desde el 2026-07-16 — correr `--update` cuando se retome.

## ⚠️ Para retomar en otra máquina (esta se borra)

El repo viaja completo salvo `.env`. Al clonar:

1. `npm install`
2. Crear `.env` desde `.env.example`:
   - `DATABASE_URL` → `npx prisma dev` la imprime al arrancar (o apuntar a la DB definitiva cuando exista)
   - `GEMINI_API_KEY` → la existente de AI Studio o una nueva en aistudio.google.com/apikey (formato `AIzaSy...`; las `AQ....` están rotas — ver AGENTS.md)
   - `GITHUB_TOKEN` → `gh auth token` con el gh CLI autenticado **como `valentinsg`** (no `abundancia33` — esa cuenta ya no se usa para este proyecto)
3. `npx prisma db push` + `npm run db:seed`
4. `npm run dev`

**La DB local es efímera** — los datos capturados después del seed (compra de creatina confirmada, fecha de vencimiento de la deuda) viven solo en esta máquina y se pierden. El seed reconstruye la base.

## Pendiente inmediato (siguiente sesión)

- [ ] **Probar en navegador real el flujo de tap "Editar" en `/capture`** — el contrato de API ya está probado (renombrar, cambiar tipo, quitar entidades), falta la prueba manual de la UI interactiva.
- [ ] **`My-Stock` es el único repo que no auto-linkeó** (el nombre real no coincide con "Mi Stock" por el cambio Mi→My) — se linkeó a mano una vez; si se vuelve a perder en un re-sync, no es un bug, solo falta mejorar `normalizeForMatch` para variantes fonéticas o volver a linkear a mano.
- [ ] **Decidir hosting definitivo de la DB** (criterio: lo más barato). Candidatos: Oracle Cloud free tier, VPS barato, o la propia PC con Docker. Incluye la higiene mínima gratis: disco cifrado, Postgres no expuesto a internet, backups.

## Fase 1 restante (contexto externo)

- [ ] **Google Calendar** — requiere proyecto en Google Cloud + OAuth consent. Es la integración que más contexto diario aporta.
- [ ] **Fuente financiera** — Mercado Pago / Brubank / Personal Pay. La más sensible; definir enfoque (API oficial vs export manual) antes de tocar credenciales.
- [ ] **Notificaciones WhatsApp (salida)** — CallMeBot: gratis, solo unidireccional (avisos, no comandos). Caso de uso: resumen diario de `/proximos` cada mañana. Requiere un cron/scheduler (el hosting de la DB probablemente defina dónde corre).
- [ ] **Timeline** (`/timeline`) — línea temporal de todo lo que tiene fecha (capturas, compras, eventos). El dato ya existe (`createdAt` + fechas en properties); es solo vista.
- [ ] **Embeddings/pgvector** — recién cuando el grafo no entre en un prompt (~miles de entidades). Hoy sería sobre-ingeniería; documentado en AGENTS.md.

## Fase 2 (el universo)

- [ ] **Canvas espacial** — react-flow o cosmos.gl: zoom, pan, drag, agrupar. La feature-firma del pitch, pospuesta a propósito hasta que el grafo esté poblado de verdad.
- [ ] **Layout tipo sidebar por dominios** (referencia: screenshot "Hyperion Core" que pasó Valentín — sidebar con Wellness/Media/Data/Integraciones, command palette Ctrl+K). Hoy la nav simple alcanza; esto es para cuando haya más vistas.

## Fase 3 (el sistema que te conoce)

- [ ] **Chat-agente con tool calling (MCP)** — la interfaz central de la referencia: "armame la dieta de mañana" y el agente consulta/escribe el grafo con herramientas. Es el salto de `/preguntar` (solo lectura) a actuar. Recién acá tiene sentido convertir las integraciones en servidores MCP reales (decisión documentada en AGENTS.md).
- [ ] **WhatsApp bidireccional** — open-wa v4 self-hosted (v5 alpha, no usar). Riesgo de ban del número aceptado explícitamente por Valentín. Permite capturar y preguntar desde WhatsApp.
- [ ] **Sugerencias proactivas** — "ya gastaste bastante este mes", "hace 2 semanas que no registrás gym". Necesita historial acumulado.
- [ ] **Autonomía progresiva de captura** — bajar la fricción de confirmación cuando el historial demuestre que la IA acierta (medible: % de capturas confirmadas sin editar).
- [ ] **Integraciones restantes** de la lista original (Spotify, Steam, Google Photos, Home Assistant...), priorizadas por valor real, no por completismo.

## Deuda técnica / detalles anotados

- `graphify` re-correr con `--update` cuando el código crezca (el grafo actual es de hoy).
- El warning de graphify "39 dangling-endpoint edges" es normal en corpus chico; revisar si crece.
- `gh auth setup-git` se des-configura entre sesiones en esta máquina (el push falla con "Repository not found") — si pasa, correr `gh auth setup-git` y reintentar.
- Los datos de expensas (deuda ~$761k, cuota ~$849k, vencimiento 20/07) están en properties de la entidad `debt`; cuando exista la integración financiera, migrar a datos estructurados por período.
