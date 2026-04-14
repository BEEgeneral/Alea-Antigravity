# Alea Signature - AI Company Configuration

## Company Overview

**Alea Signature** es una plataforma de originación privada inmobiliaria de lujo.

- **Industry**: Real Estate Private Markets
- **Market**: Spain (Madrid, Barcelona, Ibiza, etc.)
- **Product**: Off-market property investments for qualified investors
- **Revenue Model**: 40/60 commission split, milestone-based

---

## Org Chart

```
                    ┌─────────────┐
                    │    CEO      │
                    │  (Human)    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Pelayo   │ │  Centurion  │ │  Alea IAI  │
    │  (Sales)   │ │ (Lead Intel)│ │  (Email)   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## CEO (Human)

- **Alberto Gala** - Fundador y CEO
- **Role**: Supervisión estratégica, aprobación de deals grandes
- **Contact**: beenocode@gmail.com

---

## Agents

### Pelayo - Sales & Investor Relations

```json
{
  "id": "pelayo",
  "runtime": "openclaw",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514"
}
```

**Responsibilities:**
- Conversar con inversores via chat
- Mostrar blind listings
- Calcular valor estratégico
- Detectar oportunidades
- Gestionar follow-ups

**Skills:**
- `alea_crm` - Access to CRM data
- `alea_memory` - Persistent memory
- `alea_properties` - Property listings
- `alea_commissions` - Commission calculations

**Reports to:** CEO

---

### Centurion - Lead Intelligence

```json
{
  "id": "centurion", 
  "runtime": "openclaw",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514"
}
```

**Responsibilities:**
- Extraer personas de documentos
- Analizar perfiles de leads
- OSINT research
- Enriquecer datos de contacto

**Skills:**
- `centurion_scrape` - Web scraping
- `centurion_analyze` - Profile analysis
- `alea_crm` - Write to CRM

**Reports to:** CEO

---

### Alea IAI - Intelligent Email Inbox

```json
{
  "id": "aleai_iai",
  "runtime": "openclaw", 
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514"
}
```

**Responsibilities:**
- Procesar emails recibidos
- Analizar contenido con IA
- Extraer leads de emails
- Clasificar oportunidades

**Skills:**
- `iai_inbox` - Email processing
- `alea_crm` - Create/update leads

**Reports to:** CEO

---

## Database (InsForge)

All agents connect to InsForge for data:

```
Host: if8rkq6j.eu-central.insforge.app
Database: alea_signature

Tables:
- investors (investor profiles)
- properties (property listings)
- leads (CRM leads)
- mandates (mandatarios/representatives)
- collaborators (partners/finders)
- investor_interests (tracking)
- iai_inbox_suggestions (email AI)
- memory_wings, memory_rooms, memory_drawers (MemPalace)
- memory_knowledge_graph (KG triples)
```

---

## Memory System (MemPalace)

Every investor gets a "wing" in memory:

```
Wing: investor_juan@ejemplo.com
├── conversations/ (events)
│   └── "User asked about hotels in Madrid"
├── decisions/ (facts)  
│   └── "Juan prefers 2-5M€ range"
├── preferences/ (preferences)
│   └── "Only interested in Madrid center"
└── knowledge/
    └── Juan → prefers → hotels
```

---

## Key Rules

1. **CONFIDENTIALITY**: Never reveal off-market property locations
2. **NDA VERIFICATION**: Check NDA status before showing private assets
3. **NO BYPASS**: Never circumvent Alea for direct deals (2x penalty)
4. **COMMISSION**: 40% to Alea, 60% to execution pool
5. **HUMAN APPROVAL**: Deals >€10M require CEO approval

---

## Budgets

- **AI Agents**: €500/month total
- **Marketing**: €1000/month
- **Operations**: €500/month

---

## Paperclip Configuration

This company is configured for [Paperclip](https://paperclip.ing) orchestration.

To onboard:
```bash
npx paperclipai onboard --company alea
```

To run Pelayo manually:
```bash
openclaw run pelayo --skill alea_crm --memory alea_memory
```
