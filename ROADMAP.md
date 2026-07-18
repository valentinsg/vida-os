# Roadmap — vida-os

> Última actualización: 2026-07-18 (sesión 3). Documento vivo — se actualiza al final de cada sesión de trabajo.
> El documento de producto completo (visión, objeciones, arquitectura) está publicado como artifact de Claude; pedirle el link a Valentín si hace falta.
> **Repo**: https://github.com/valentinsg/vida-os (migrado el 2026-07-18 desde `abundancia33/vida-os`, que ya está borrado — Valentín no lo quería en esa cuenta).

## Estado actual (lo que ya funciona)

- **Identidad visual**: tema oscuro por defecto, paleta propia (moss-green/grafito, la misma familia del documento de producto original) en vez de shadcn gris de fábrica. Tipografía (Geist Sans/Mono) sin cambios — ya era una buena elección, no la genérica Inter. Falta el layout de sidebar (Fase 2).
- **Modelo de grafo**: `Entity` + `Relationship` + `Capture` en Postgres/Prisma, tipos de vocabulario abierto. Seed con datos reales de la vida de Valentín (41 entidades) + ~66 repos sincronizados de GitHub.
- **Captura tap-to-confirm** (`/capture`): texto libre → Gemini propone entidades/relaciones → confirmás, editás (renombrar, cambiar tipo, quitar entidades) o descartás. Probado end-to-end con "Compré creatina" y con un caso editado ("Pagué el gym").
- **Consulta en lenguaje natural** (`/preguntar`): grafo completo en contexto, responde con citas a entidades. Probado con las preguntas del pitch original.
- **Próximos** (`/proximos`): recordatorios y vencimientos ordenados por fecha (vacuna gatos, deuda expensas con vencimiento 20/07).
- **Timeline** (`/timeline`): historial cronológico de todo lo capturado, agrupado por día.
- **Entidades** (`/entities`): lista con filtro por tipo, detalle con relaciones navegables, edición inline de nombre/propiedades, y borrado (de la entidad completa o de una relación puntual, con confirmación).
- **GitHub sync** (botón en `/entities`): trae repos de `valentinsg` (66 repos) y los vincula a proyectos por nombre — **resuelto**, Estudio VE, Mi Stock (aliaseado "Stockeo" en el grafo), Presidencial, Pelotita y Avi Salud ya están todos linkeados. Ahora resiste renames de GitHub sin pisar alias que hayas puesto vos.
- **CallMeBot (WhatsApp saliente)**: código listo (`POST /api/notify/whatsapp`, resumen de `/proximos` de los próximos 14 días), **sin probar en vivo** — falta que consigas la API key (ver abajo).
- **Google Calendar**: código listo (auth OAuth + sync de eventos de los próximos 30 días, con menciones automáticas a personas/mascotas/proyectos), **sin probar en vivo** — falta que crees el proyecto en Google Cloud (ver abajo).
- **graphify**: el código del proyecto está indexado en `graphify-out/` (consultar el grafo antes de releer archivos en frío). Desactualizado desde el 2026-07-16 — correr `--update` cuando se retome.

## ⚠️ Para retomar en otra máquina (esta se borra)

El repo viaja completo salvo `.env`. Al clonar:

1. `npm install`
2. Crear `.env` desde `.env.example`:
   - `DATABASE_URL` → `npx prisma dev` la imprime al arrancar (o apuntar a la DB definitiva cuando exista)
   - `GEMINI_API_KEY` → la existente de AI Studio o una nueva en aistudio.google.com/apikey (formato `AIzaSy...`; las `AQ....` están rotas — ver AGENTS.md)
   - `GITHUB_TOKEN` → `gh auth token` con el gh CLI autenticado **como `valentinsg`** (no `abundancia33` — esa cuenta ya no se usa para este proyecto)
   - `CALLMEBOT_PHONE` / `CALLMEBOT_APIKEY` → ver pasos abajo (opcional, solo si querés notificaciones)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` → ver pasos abajo (opcional, solo si querés sync de Calendar)
3. `npx prisma db push` + `npm run db:seed`
4. `npm run dev`

**La DB local es efímera** — los datos capturados después del seed (compra de creatina confirmada, fecha de vencimiento de la deuda) viven solo en esta máquina y se pierden. El seed reconstruye la base.

## 👉 Empezar acá la próxima sesión

### Pasos que solo puede hacer Valentín (nada de código, solo cuentas)

**Para activar CallMeBot (WhatsApp saliente) — 2 minutos:**
1. Agregar el contacto de CallMeBot en WhatsApp (buscarlo, el número está en callmebot.com)
2. Mandarle el mensaje exacto: `I allow callmebot to send me messages`
3. Te responde con una API key — pegarla en `.env` como `CALLMEBOT_APIKEY`, y tu número (con código de país, sin +) como `CALLMEBOT_PHONE`
4. Probar: `curl -X POST http://localhost:3000/api/notify/whatsapp`

**Para activar Google Calendar — 10 minutos:**
1. Ir a console.cloud.google.com, crear un proyecto nuevo
2. Habilitar la "Google Calendar API" (buscarla en la librería de APIs)
3. Configurar la pantalla de consentimiento OAuth (tipo "External" alcanza para uso personal)
4. Crear credenciales → OAuth Client ID → tipo "Web application" → agregar `http://localhost:3000/api/auth/google/callback` como redirect URI autorizado
5. Copiar el Client ID y Client Secret a `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
6. Con el server corriendo, visitar `http://localhost:3000/api/auth/google` **en el navegador** (no con curl — necesita tu login de Google)
7. Te va a devolver un `refresh_token` en JSON — copiarlo a `.env` como `GOOGLE_REFRESH_TOKEN`
8. Probar: botón "Sincronizar Calendar" en `/entities`

### Después de eso, en orden de prioridad:

1. **Decidir hosting definitivo de la DB** (criterio: lo más barato) — bloquea el cron real de WhatsApp (hoy el endpoint existe pero nada lo dispara solo) y dejar de depender de `npx prisma dev` efímero. Candidatos: Oracle Cloud free tier, VPS barato, o la propia PC con Docker. Incluye higiene mínima gratis: disco cifrado, Postgres no expuesto a internet, backups. **Necesita una decisión de Valentín.**
2. **Probar en navegador real el flujo de tap "Editar" en `/capture`** — el contrato de API ya está probado por curl (renombrar, cambiar tipo, quitar entidades), falta la prueba manual interactiva.
3. **Fuente financiera** (Mercado Pago / Brubank / Personal Pay) — la integración de Fase 1 que queda, y la más sensible; definir enfoque antes de tocar credenciales.

## Fase 1 restante (contexto externo)

- [x] **Google Calendar** — código hecho (`src/lib/integrations/google-calendar.ts`, rutas de auth + `/api/sync/calendar`). Pendiente: que Valentín cree el proyecto en Google Cloud (pasos arriba). Sin probar en vivo hasta entonces.
- [ ] **Fuente financiera** — Mercado Pago / Brubank / Personal Pay. La más sensible; definir enfoque (API oficial vs export manual) antes de tocar credenciales.
- [x] **Notificaciones WhatsApp (salida)** — código hecho (`src/lib/integrations/callmebot.ts`, `/api/notify/whatsapp`). Pendiente: que Valentín consiga la API key (pasos arriba). El cron real que lo dispare todos los días sigue bloqueado en la decisión de hosting.
- [ ] **Embeddings/pgvector** — recién cuando el grafo no entre en un prompt (~miles de entidades). Hoy sería sobre-ingeniería; documentado en AGENTS.md.

## Fase 2 (el universo)

- [ ] **Canvas espacial** — react-flow o cosmos.gl: zoom, pan, drag, agrupar. La feature-firma del pitch, pospuesta a propósito hasta que el grafo esté poblado de verdad.
- [ ] **Layout tipo sidebar por dominios** (referencia: screenshot "Hyperion Core" que pasó Valentín — sidebar con Wellness/Media/Data/Integraciones, command palette Ctrl+K). La identidad visual (paleta, tema oscuro) ya está — falta la estructura de sidebar en sí, para cuando haya más vistas.

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
