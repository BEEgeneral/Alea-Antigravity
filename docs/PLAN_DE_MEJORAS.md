# Alea Signature - Plan de Mejoras y Refactorización

**Proyecto:** Alea Signature  
**Fecha:** 2026-04-26  
**Stack:** Next.js 16.1.6 + InsForge + MiniMax M2.7 + TypeScript + Tailwind CSS v4

---

## RESUMEN EJECUTIVO

El proyecto está **funcionalmente operativo** pero presenta **technical debt significativa** en varias áreas. Se identificaron **81 API routes**, **37 componentes React**, **5 errores TypeScript activos**, y múltiples patrones duplicados. La arquitectura core es sólida pero necesita limpieza y consolidación.

---

## HALLAZGOS DE LA AUDITORÍA

### ✅ FORTALEZAS
- Arquitectura clara: PRAETORIUM (admin), CENTURION (agente IA), RADAR (blind listings)
- CRM completo: leads, investors, properties, collaborators, mandates
- IAI Inbox funcional con análisis de emails via IMAP + MiniMax
- Sistema MemPalace de memoria de 4 niveles
- Hermestic Tools (922 líneas) bien estructuradas
- Blind listings funcionando (properties con is_off_market)
- Agenda con botones meet/teams/zoom
- Types definidos en admin.ts (395 líneas)

### ⚠️ PROBLEMAS CRÍTICOS

#### 1. **Error TypeScript activo** (5 errores)
- `createAuthenticatedClient()` es `async` pero se llama sin `await` en 3 archivos
- Archivos afectados: `network-signal/route.ts`, `radar/scan/route.ts`, `lib/radar/scanner.ts`
- **YA ARREGLADO** parcialmente (pending: testar)

#### 2. **Ruta duplicada** - /centrion/ vs /centurion/
- Existe `src/app/centrion/` y `src/app/centurion/` como carpetas separadas
- Causa: typo histórico que se mantiene por compatibilidad
- **Decisión pendiente:** cuál es la correcta y cuál eliminar

#### 3. **praetorium/page.tsx - 2985 líneas** (180KB)
- Archivo monolítico que contiene todo el dashboard admin
- Violación directa del principio de responsabilidad única
- Difícil de mantener, testear, y hacer code review
- **Prioridad: ALTA**

#### 4. **Code duplication - getFreshAccessToken** (4 veces)
- Duplicado en: `agenda/actions`, `agenda/calendar-sync`, `gmail/emails`, `gmail/calendar`
- Mismo código copiado en 4 archivos distintos

#### 5. **AI SDK duplicado**
- `src/lib/minimax.ts` - Usa OpenAI SDK con MiniMax
- `src/lib/ai-minimax.ts` - Usa Anthropic SDK con MiniMax
- Inconsistente: cuando llamas "MiniMax" deberías usar su API, no OpenAI ni Anthropic

#### 6. **URLs hardcoded**
- `if8rkq6j.eu-central.insforge.app` aparece 16+ veces hardcoded
- Debe ser `NEXT_PUBLIC_INSFORGE_URL` en `.env`
- Archivo más problemático: `src/app/api/webhook/email/route.ts` tiene el Bearer token hardcoded

#### 7. **magic numbers** sin constantes
- `60000` (timeout) aparece en múltiples archivos
- `15000` (límite de caracteres) en praetorium
- `900000` (15 min polling) en IMAP
- Sin archivos de constantes nombradas

### 🔴 DEBT TÉCNICO MEDIO

#### 8. **81 API routes** - Sin categorización clara
- Mezcla de funcionalidades sin estructura de carpetas clara
- `webhook/`, `gmail/`, `hermes/`, `agenda/`, `iai-inbox/` mezclados con `paperclip/`, `crm-chat/`
- Propuesta: reorganizar bajo `/api/v1/` con versioning

#### 9. **Component size**
- `AgendaPanel.tsx`: 32KB
- `NDAForm.tsx`: 32KB
- `MemoryPanel.tsx`: 36KB
- `pelayo-chat/page.tsx`: duplicado?

#### 10. **37 componentes React** - Components/admin/
- Mezcla de componentes de página completa con componentes reutilizables
- No hay diferenciación clara entre `components/ui/` (reutilizables) y `components/admin/` (de negocio)

---

## PLAN DE MEJORAS PRIORIZADO

### 🔴 FASE 0 — Critical Hotfix (ESTA SEMANA)

| # | Mejora | Impacto | Esfuerzo | Estado |
|---|--------|---------|----------|--------|
| 0.1 | Testar fix de `createAuthenticatedClient` | Bug activo | Bajo | ✅ Listo, testar |
| 0.2 | Decidir y limpiar `/centrion/` vs `/centurion/` | Confusión | Bajo | **Pendiente** |
| 0.3 | Crear `.env.example` con todas las variables | Seguridad | Bajo | **Pendiente** |

### 🟠 FASE 1 — Limpieza de Debt Crítico (1-2 semanas)

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|--------|---------|----------|-----------|
| 1.1 | Extraer constantes: URLs, magic numbers, timeouts → `src/lib/constants.ts` | Mantenibilidad | Medio | 🔴 ALTA |
| 1.2 | Consolidar `getFreshAccessToken` → `src/lib/gmail-utils.ts` | DRY | Bajo | 🟠 ALTA |
| 1.3 | Unificar AI SDKs: `ai-minimax.ts` + `minimax.ts` → `src/lib/ai.ts` | Consistencia | Medio | 🟠 ALTA |
| 1.4 | Mover URLs hardcoded de `webhook/email/route.ts` a env vars | Seguridad | Bajo | 🔴 ALTA |

### 🟡 FASE 2 — Refactorización de Components (2-4 semanas)

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|--------|---------|----------|-----------|
| 2.1 | **Fragmentar `praetorium/page.tsx`** (2985 líneas → 20+ componentes) | Mantenibilidad | Alto | 🔴 CRÍTICA |
| 2.2 | Separar `components/admin/` → `components/admin/` + `components/ui/` | Claridad | Medio | 🟠 ALTA |
| 2.3 | Extraer `AgendaPanel.tsx` (32KB) en sub-componentes | Legibilidad | Medio | 🟡 MEDIA |
| 2.4 | Extraer `NDAForm.tsx` (32KB) en sub-componentes | Legibilidad | Medio | 🟡 MEDIA |

### 🟢 FASE 3 — Arquitectura y Escalabilidad (1-2 meses)

| # | Mejora | Impacto | Esfuerzo | Prioridad |
|---|--------|---------|----------|-----------|
| 3.1 | Reorganizar API routes bajo `/api/v1/` con versioning | DX + mantenibilidad | Medio | 🟡 MEDIA |
| 3.2 | Crear `src/lib/api/` con utilidades compartidas para routes | DRY | Bajo | 🟡 MEDIA |
| 3.3 | Implementar error boundary global | UX | Bajo | 🟡 MEDIA |
| 3.4 | Dashboard de métricas de API (latencia, errores) | Observabilidad | Medio | 🟢 BAJA |

---

## IMPLEMENTACIONES MVP PENDIENTES DE COMPLETAR

### ✅ YA IMPLEMENTADO (esta sesión)
- [x] Tabla `signals` (schema SQL generado)
- [x] Tabla `opportunities` (schema SQL generado)
- [x] Endpoint `/api/signals` + `/api/signals/[id]`
- [x] Endpoint `/api/opportunities` + `/api/opportunities/[id]`
- [x] Endpoint `/api/migrate/radar` (SQL para dashboard)
- [x] Flujo IAI Inbox → crear entity (`/api/iai-inbox/[id]/create-entity`)
- [x] Endpoint detalle IAI Inbox (`/api/iai-inbox/[id]`)
- [x] Scanner RADAR Alea skeleton (`lib/radar/scanner.ts`)
- [x] Endpoint scanner (`/api/radar/scan`)
- [x] RED Off-market webhook (`/api/network-signal`)
- [x] RED Off-market docs (`docs/RED_OFFMARKET_WEBHOOK.md`)

### ⚠️ POR COMPLETAR

| # | Feature | Bloqueado por | Esfuerzo |
|---|---------|--------------|----------|
| P1 | Dashboard RADAR Alea (Centurion) | Migración BBDD | Medio |
| P2 | Página RADAR Investors (blind listings) | Ninguno | Bajo |
| P3 | Cron jobs para scanner (n8n) | Scanner funcional | Bajo |
| P4 | Workflow IAI → crear property/investor (frontend) | Endpoints listos | Medio |
| P5 | RED form (Telegram/Notion → n8n → BBDD) | Endpoint listo | Medio |

---

## DECISIONES PENDIENTES DE USUARIO

1. **`/centrion/` vs `/centurion/`** — ¿Cuál eliminamos? Ambos funcionan actualmente
2. **`praetorium/page.tsx`** — ¿Refactorizar ahora o continuar añadiendo features?
3. **AI SDK** — ¿Mantener ambos o consolidar en uno solo?
4. **API Versioning** — ¿Empezar con `/api/v1/` o mantener como está?

---

## GRACIAS POR REVISAR
