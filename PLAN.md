# PLAN.md (Master Ledger - Aleasignature)

## 🗺️ Master Roadmap
- [x] **Milestone 1:** Definición arquitectónica (Frontend + Database Schema).
- [x] **Milestone 2:** Inicialización de Next.js (App Router, Tailwind, Framer Motion) y tokens de diseño visual (Quiet Luxury).
- [x] **Milestone 3:** Creación de Estructuras DB Supabase y Seguridad Bancaria RLS (Protección Off-Market y Data Room).
- [x] **Milestone 4:** Desarrollo de Edge Function de Matching y Registro de Auditoría de Leads.
- [x] **Milestone 5:** Construcción UI Core (Buscador, Calculadora de Rentabilidad, Generador de PDFs).
- [x] **Milestone 6:** Implementación de Login de Agentes e Interfaz de Aprobación.
- [x] **Milestone 7:** Refactorización del CRM: Sidebar Detallado de Leads y Log de Interacciones.
- [x] **Milestone 8:** Implementación de Directorio de Mandatarios e integración en Arquitectura de Operación.
- [x] **Milestone 9:** Final Sync & /audit de Quality Gate Visual/Funcional.
- [x] **Milestone 10:** SEO Power-Up & Search Console Strategy.
- [x] **Milestone 11:** Production Deployment - Sync GitHub & Vercel.
- [x] **Milestone 12:** Advanced AI Interactions & Animations (Kinetic UI).
- [x] **Milestone 13:** Alea Agenda - Sistema de Acciones y Recordatorios con SLAs y Sugerencias Proactivas.

## 📝 Current Trajectory
**Optimización de Experiencia IA:** Implementación de tipografía kinética, transiciones Loom-style y animaciones de "presencia" de IA para elevar el dashboard al estándar Alea. Sincronización final con Vercel.

## 🤖 Squad Status
| Agent | Task | Status |
|-------|------|--------|
| Antigravity (Senior Product Engineer) | Mandatarios Tab & CRM Integration | Verified & Polished |
| Antigravity | Agent Access & Magic Link Fix (aleasignature.com) | Verified & Polished |
| Antigravity | Final Sync & /audit (Quality Gate) | Verified & Polished |
| Antigravity | Technical SEO & Search Console Setup | Verified & Polished |
| Antigravity | AI Interactions & Loom Transitions | Verified & Polished |
| Antigravity | Structural Layout Audit & Repair | Verified & Polished |
| Antigravity | Production Sync (GitHub + Vercel) | Verified & Polished |

## 💾 State Snapshot
- **Database:** Tabla `mandatarios` definida y columnas de relación en `leads` añadidas para soporte de intermediación delegada.
- **Frontend Stack:** Nueva pestaña de navegación con visualización de tarjetas premium y formularios de alta/edición de mandatarios operativos.
- **Flujo de Negociación:** La "Sala de Negociación" ahora refleja si una parte está gestionada por un mandatos, permitiendo su selección directa.
- **Quality Gate:** Auditoría completada con éxito. Implementación de estados de carga (Skeletons) premium para transiciones fluidas y confianza del usuario.
- **SEO & Indexación:** Implementación de `sitemap.ts`, `robots.txt` y **Structured Data (JSON-LD)**. Verificación de Google Search Console integrada.
- **AI UI Core:** Tipografía kinética en resúmenes IAI y transiciones spring-physics en modales de interpretación.
- **Visual Clarity:** Estandarización de formato numérico `es-ES` para métricas financieras y superficies.
- **Alea Centurión:** Sistema de OSINT para perfiles de personas/empresas con scraping de LinkedIn, Google, Twitter, Instagram.
- **Alea Agenda:** Sistema completo de acciones y recordatorios vinculada al CRM.

## 🎯 Alea Agenda - Sistema de Acciones y Recordatorios

### Arquitectura
| Tabla | Propósito |
|-------|-----------|
| `agenda_actions` | Acciones principales vinculadas a leads (llamadas, emails, reuniones, docs) |
| `agenda_reminders` | Recordatorios automáticos con timing y SLA |
| `pipeline_action_templates` | Plantillas de acciones por etapa del pipeline |
| `agenda_settings` | Configuración global de SLAs y timing |
| `agenda_activity_log` | Log de auditoría para tracking |

### Flujo de Operativa por Etapa
```
PROSPECT → QUALIFIED → DUE DILIGENCE → OFFER → CLOSING
   │           │            │           │         │
   ├─ Contacto inicial    ├─ Visita    ├─ Oferta  ├─ Closing
   ├─ Presentación Alea    ├─ Due Dil.  ├─ Jurídico├─ Docs finales
   └─ Registrar interés   ├─ Verificar  └─ Mandato  └─ Transferencia
                          └─ Análisis
```

### SLAs por Defecto
| Etapa | SLA (horas) | Acciones típicas |
|-------|-------------|------------------|
| Prospect | 72h | Contacto, Presentación |
| Qualified | 96h | NDA, KYC, Match |
| Due Diligence | 120h | Visita, Due Diligence, Financiación |
| Offer | 72h | Oferta, Revisión, Mandato |
| Closing | 48h | Closing, Docs, Transferencia |

### APis
- `GET/POST/PATCH/DELETE /api/agenda/actions` - CRUD de acciones
- `GET/POST/PATCH/DELETE /api/agenda/reminders` - CRUD de recordatorios
- `GET /api/agenda/suggestions` - Sugerencias proactivas para agentes
- `GET /api/agenda/pelayo` - Datos para chat de Pelayo

### Sugerencias Proactivas
El sistema genera automáticamente:
1. **Overdue** - Acciones vencidas con horas de retraso
2. **SLA Warning** - Acciones próximas a romper SLA (24h antes)
3. **Stage Suggestions** - Acciones que deberían existir según etapa
4. **Follow-up** - Leads sin actividad en 3+ días

### Integración Pelayo
Pelayo puede consultar `/api/agenda/pelayo` para obtener:
- Resumen de acciones pendientes
- Count de acciones overdue
- Acciones de hoy
- Resumen en lenguaje natural
