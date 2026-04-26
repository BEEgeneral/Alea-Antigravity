# RED Alea - Off-Market Signal Collection

## Concepto
Tu red (patrimonialistas, arquitectos, Century 21, Family Offices) reporta activos off-market via:
- **Telegram bot** → n8n → `/api/network-signal`
- **Notion form** → n8n → `/api/network-signal`
- **Formulario web** (futuro) → directo

## Webhook Endpoint

```
POST /api/network-signal
Authorization: Bearer <NETWORK_WEBHOOK_SECRET>
Content-Type: application/json
```

## n8n Workflow Template

```
┌─────────────────────────────────────────────────────────────────┐
│  TRIGGER: Webhook (Telegram Bot / Notion / Form)                │
│  URL: https://if8rkq6j.eu-central.insforge.app/api/network-signal│
│  Method: POST                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CODE: Parse payload                                            │
│                                                                 │
│  const data = {                                                 │
│    contact_name: $json.contact_name,                            │
│    contact_email: $json.contact_email,                          │
│    contact_phone: $json.contact_phone,                          │
│    contact_company: $json.contact_company,                      │
│    title: $json.title,                                          │
│    asset_type: $json.asset_type,                                │
│    location_hint: $json.location_hint,                           │
│    address: $json.address,                                      │
│    price: $json.price,                                          │
│    meters: $json.meters,                                        │
│    description: $json.description,                             │
│    network_source_type: $json.network_source_type,              │
│    network_source_name: $json.network_source_name,              │
│    notes: $json.notes,                                          │
│  };                                                              │
│                                                                 │
│  return { json: data };                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  HTTP REQUEST: POST to /api/network-signal                      │
│  URL: https://if8rkq6j.eu-central.insforge.app/api/network-signal│
│  Headers: { Authorization: Bearer <NETWORK_WEBHOOK_SECRET> }    │
│  Body: {{ $json }}                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  IF Success:                                                    │
│    → Telegram: Send confirmation to user                        │
│    → Slack: Notify #radar channel                               │
│  IF Error:                                                      │
│    → Slack: Alert #errors                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Payload Schema

```json
{
  "contact_name": "Carlos Martínez",
  "contact_email": "carlos@patrimonialista.es",
  "contact_phone": "+34612345678",
  "contact_company": "Martínez Patrimonial",
  "title": "Edificio de viviendas en Chamberí",
  "asset_type": "RESIDENTIAL",
  "location_hint": "Madrid, Chamberí",
  "address": "Calle Fuencarral 45, Madrid",
  "price": 3500000,
  "price_raw": "3.5M€",
  "meters": 1200,
  "description": "Edificio de 6 plantas con 8 viviendas, todo ocupado",
  "network_source_type": "patrimonialista",
  "network_source_name": "Carlos Martínez",
  "notes": "El propietario está motivado, necesita liquidez"
}
```

## Field Reference

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `title` | string | ✓ | Nombre del activo |
| `contact_name` | string | - | Nombre del contacto |
| `contact_email` | string | - | Email del contacto |
| `contact_phone` | string | - | Teléfono del contacto |
| `contact_company` | string | - | Empresa/bufete del contacto |
| `asset_type` | string | - | RESIDENTIAL, COMMERCIAL, INDUSTRIAL, LAND, HOTEL, RETAIL, OFFICE, MIXED_USE |
| `location_hint` | string | - | Ciudad/barrio |
| `address` | string | - | Dirección completa |
| `price` | number | - | Precio en euros |
| `price_raw` | string | - | Precio en texto (ej: "3.5M€", "A consultar") |
| `meters` | number | - | Metros cuadrados |
| `description` | string | - | Descripción del activo |
| `network_source_type` | string | - | patrimonialista, architect, century21, family_office, other |
| `network_source_name` | string | - | Nombre de la fuente |
| `notes` | string | - | Notas adicionales |

## Telegram Bot Setup (Opcional)

```
1. Crear bot via @BotFather
2. Guardar token
3. En n8n: Telegram Trigger → Parse message → Network Signal API
```

## Environment Variables

```env
NETWORK_WEBHOOK_SECRET=aleasignature-network  # Secret for n8n auth
```

## Response

```json
{
  "success": true,
  "signal_id": "uuid",
  "lead_id": "uuid",
  "alea_score": 75,
  "message": "Signal creado correctamente"
}
```
