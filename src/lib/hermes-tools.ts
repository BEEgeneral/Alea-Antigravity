/**
 * Hermes Tools - Function Calling Definitions for MiniMax M2.7
 * 
 * These tools enable Hermes to interact with:
 * - InsForge CRM (leads, investors, properties, mandates)
 * - MemPalace Memory System
 * - Agenda/Actions
 * - Email/NDA
 * - Document Analysis
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const HermesTools = {
  getDefaultTools(): ToolDefinition[] {
    return [
      ...this.crmTools(),
      ...this.memoryTools(),
      ...this.agendaTools(),
      ...this.utilityTools(),
    ];
  },

  crmTools(): ToolDefinition[] {
    return [
      {
        name: 'crm_query',
        description: 'Consulta datos del CRM de Alea Signature. Use para buscar leads, investors, properties, mandatarios, o collaborators. Devuelve datos estructurados.',
        parameters: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              enum: ['leads', 'investors', 'properties', 'mandatarios', 'collaborators', 'investor_interests'],
              description: 'Tabla del CRM a consultar',
            },
            filters: {
              type: 'object',
              description: 'Filtros de consulta (eq, neq, gt, lt, etc.)',
              properties: {
                status: { type: 'string' },
                is_off_market: { type: 'boolean' },
                kyc_status: { type: 'string' },
                piedra_personalidad: { type: 'string' },
                asset_type: { type: 'string' },
              },
            },
            limit: {
              type: 'number',
              description: 'Límite de resultados (default: 10, max: 50)',
              default: 10,
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'crm_create',
        description: 'Crea un nuevo registro en el CRM. Use para crear leads, investors, o investor_interests.',
        parameters: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              enum: ['leads', 'investors', 'investor_interests', 'agenda_actions'],
              description: 'Tabla donde crear el registro',
            },
            data: {
              type: 'object',
              description: 'Datos del registro a crear',
              properties: {
                name: { type: 'string', description: 'Nombre del lead/investor' },
                email: { type: 'string', description: 'Email' },
                phone: { type: 'string', description: 'Teléfono' },
                source: { type: 'string', description: 'Fuente del lead' },
                status: { type: 'string', description: 'Estado inicial' },
                full_name: { type: 'string', description: 'Nombre completo' },
                budget_min: { type: 'number', description: 'Presupuesto mínimo' },
                budget_max: { type: 'number', description: 'Presupuesto máximo' },
                investor_type: { type: 'string', description: 'Tipo: FAMILY_OFFICE, HNW_INDIVIDUAL, etc.' },
                preferred_locations: { type: 'array', items: { type: 'string' }, description: 'Ubicaciones preferidas' },
                title: { type: 'string', description: 'Título de propiedad' },
                property_id: { type: 'string', description: 'ID de propiedad' },
                interest_type: { type: 'string', description: 'Tipo de interés' },
              },
            },
          },
          required: ['table', 'data'],
        },
      },
      {
        name: 'crm_update',
        description: 'Actualiza un registro existente en el CRM.',
        parameters: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              enum: ['leads', 'investors', 'properties', 'mandatarios', 'agenda_actions'],
              description: 'Tabla a actualizar',
            },
            id: {
              type: 'string',
              description: 'ID del registro a actualizar',
            },
            data: {
              type: 'object',
              description: 'Campos a actualizar',
              properties: {
                status: { type: 'string', description: 'Nuevo estado' },
                kyc_status: { type: 'string', description: 'Estado KYC' },
                nda_status: { type: 'string', description: 'Estado NDA' },
                piedra_personalidad: { type: 'string', description: 'Clasificación Piedras Preciosas' },
                outcome: { type: 'string', description: 'Resultado de la acción' },
                completion_notes: { type: 'string', description: 'Notas de completado' },
              },
            },
          },
          required: ['table', 'id', 'data'],
        },
      },
      {
        name: 'crm_get_investor_profile',
        description: 'Obtiene el perfil completo de un inversor incluyendo clasificación Piedras Preciosas, historial, y propiedades de interés.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor',
            },
            investor_email: {
              type: 'string',
              description: 'Email del inversor (alternativo a ID)',
            },
          },
        },
      },
      {
        name: 'search_properties',
        description: 'Busca propiedades que matcheen criterios del inversor. Soporta blind listings (sin revelar ubicación exacta).',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Zona/ciudad preferida (Madrid, Barcelona, etc.)',
            },
            budget_min: {
              type: 'number',
              description: 'Presupuesto mínimo en euros',
            },
            budget_max: {
              type: 'number',
              description: 'Presupuesto máximo en euros',
            },
            asset_type: {
              type: 'string',
              enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND', 'MIXED_USE'],
              description: 'Tipo de activo',
            },
            min_sqm: {
              type: 'number',
              description: 'Metros cuadrados mínimos',
            },
            is_off_market: {
              type: 'boolean',
              description: 'Solo propiedades off-market',
              default: true,
            },
          },
        },
      },
    ];
  },

  memoryTools(): ToolDefinition[] {
    return [
      {
        name: 'memory_store',
        description: 'Almacena información importante en el sistema de memoria MemPalace de Alea Signature.',
        parameters: {
          type: 'object',
          properties: {
            wing_type: {
              type: 'string',
              enum: ['investor', 'property', 'project', 'session', 'general'],
              description: 'Tipo de wing (espacio de memoria)',
            },
            entity_id: {
              type: 'string',
              description: 'ID de la entidad relacionada',
            },
            entity_email: {
              type: 'string',
              description: 'Email de la entidad (para wings de inversor)',
            },
            room_name: {
              type: 'string',
              description: 'Nombre de la habitación (conversations, decisions, preferences, facts)',
            },
            hall_type: {
              type: 'string',
              enum: ['facts', 'events', 'discoveries', 'preferences', 'advice'],
              description: 'Tipo de contenido',
            },
            content: {
              type: 'string',
              description: 'Contenido a almacenar',
            },
            importance: {
              type: 'number',
              description: 'Importancia (1-100, default: 50)',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
          },
          required: ['room_name', 'hall_type', 'content'],
        },
      },
      {
        name: 'memory_recall',
        description: 'Recupera información de la memoria MemPalace para contexto de conversación.',
        parameters: {
          type: 'object',
          properties: {
            entity_email: {
              type: 'string',
              description: 'Email del inversor',
            },
            entity_id: {
              type: 'string',
              description: 'ID de la entidad',
            },
            wing_name: {
              type: 'string',
              description: 'Nombre específico del wing',
            },
            hall_type: {
              type: 'string',
              enum: ['facts', 'events', 'discoveries', 'preferences', 'advice'],
              description: 'Filtrar por tipo de contenido',
            },
            limit: {
              type: 'number',
              description: 'Número de recuerdos a recuperar (default: 10)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'memory_search',
        description: 'Busca en toda la memoria MemPalace por palabra clave o concepto.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Término de búsqueda',
            },
            limit: {
              type: 'number',
              description: 'Resultados máximo (default: 20)',
              default: 20,
            },
          },
          required: ['query'],
        },
      },
    ];
  },

  agendaTools(): ToolDefinition[] {
    return [
      {
        name: 'agenda_create_action',
        description: 'Crea una nueva acción o recordatorio en la agenda del agente.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Título de la acción',
            },
            description: {
              type: 'string',
              description: 'Descripción detallada',
            },
            action_type: {
              type: 'string',
              enum: ['CALL', 'EMAIL', 'MEETING', 'DOCUMENT', 'FOLLOW_UP', 'VISIT', 'NDA', 'OFFER', 'CLOSING'],
              description: 'Tipo de acción',
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Prioridad',
              default: 'medium',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora límite (ISO 8601)',
            },
            lead_id: {
              type: 'string',
              description: 'ID del lead asociado',
            },
            assigned_agent_id: {
              type: 'string',
              description: 'ID del agente asignado (default: usuario actual)',
            },
          },
          required: ['title', 'action_type', 'due_date'],
        },
      },
      {
        name: 'agenda_get_pending',
        description: 'Obtiene las acciones y recordatorios pendientes del agente actual o de un lead específico.',
        parameters: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'string',
              description: 'Filtrar por lead específico',
            },
            agent_id: {
              type: 'string',
              description: 'Filtrar por agente (default: actual)',
            },
            include_overdue: {
              type: 'boolean',
              description: 'Incluir acciones vencidas',
              default: true,
            },
          },
        },
      },
      {
        name: 'agenda_complete_action',
        description: 'Marca una acción como completada y opcionalmente añade notas.',
        parameters: {
          type: 'object',
          properties: {
            action_id: {
              type: 'string',
              description: 'ID de la acción',
            },
            outcome: {
              type: 'string',
              description: 'Resultado (COMPLETED, CANCELLED, RESCHEDULED)',
            },
            notes: {
              type: 'string',
              description: 'Notas de cierre',
            },
          },
          required: ['action_id'],
        },
      },
    ];
  },

  utilityTools(): ToolDefinition[] {
    return [
      {
        name: 'detect_asset',
        description: 'Analiza un texto (email, documento, nota) y detecta si contiene información sobre activos/propiedades. Extrae datos del activo si lo encuentra.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Texto a analizar (email, mensaje, nota)',
            },
            source: {
              type: 'string',
              enum: ['email', 'document', 'chat', 'note', 'market_data'],
              description: 'Fuente del texto',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'match_investors_to_asset',
        description: 'Busca inversores existentes que puedan estar interesados en un activo específico basado en presupuesto, ubicación y tipo de activo.',
        parameters: {
          type: 'object',
          properties: {
            asset_id: {
              type: 'string',
              description: 'ID del activo/propiedad',
            },
            asset_data: {
              type: 'object',
              description: 'Datos del activo si no existe aún en DB',
              properties: {
                price: { type: 'number' },
                location: { type: 'string' },
                asset_type: { type: 'string' },
                size_sqm: { type: 'number' },
              },
            },
            limit: {
              type: 'number',
              description: 'Número máximo de inversores a devolver (default: 5)',
              default: 5,
            },
          },
        },
      },
      {
        name: 'classify_asset',
        description: 'Clasifica un activo según las categorías de Alea Signature: Hotel, Edificio, Suelo, Retail, Oficinas, Logístico.',
        parameters: {
          type: 'object',
          properties: {
            asset_data: {
              type: 'object',
              description: 'Datos del activo a clasificar',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                address: { type: 'string' },
              },
            },
          },
          required: ['asset_data'],
        },
      },
      {
        name: 'analyze_investment_opportunity',
        description: 'Analiza una oportunidad de inversión y genera un resumen con métricas clave, fortalezas, debilidades y next steps recomendados.',
        parameters: {
          type: 'object',
          properties: {
            asset_id: {
              type: 'string',
              description: 'ID del activo (opcional si se pasa asset_data)',
            },
            asset_data: {
              type: 'object',
              description: 'Datos del activo',
              properties: {
                title: { type: 'string' },
                price: { type: 'number' },
                location: { type: 'string' },
                asset_type: { type: 'string' },
                size_sqm: { type: 'number' },
              },
            },
            investor_profile: {
              type: 'object',
              description: 'Perfil del inversor objetivo',
              properties: {
                budget_min: { type: 'number' },
                budget_max: { type: 'number' },
                preferred_locations: { type: 'array', items: { type: 'string' } },
                piedra_personalidad: { type: 'string' },
              },
            },
          },
        },
      },
      {
        name: 'get_off_market_opportunities',
        description: 'Busca oportunidades off-market que coincidan con criterios específicos del inversor.',
        parameters: {
          type: 'object',
          properties: {
            budget_min: { type: 'number', description: 'Presupuesto mínimo' },
            budget_max: { type: 'number', description: 'Presupuesto máximo' },
            location: { type: 'string', description: 'Ubicación preferida' },
            asset_type: { type: 'string', description: 'Tipo de activo' },
            min_sqm: { type: 'number', description: 'Metros mínimos' },
          },
        },
      },
      {
        name: 'calculate_commission',
        description: 'Calcula la comisión de una operación según las reglas de Alea Signature.',
        parameters: {
          type: 'object',
          properties: {
            property_price: {
              type: 'number',
              description: 'Precio de la propiedad en euros',
            },
            agent_profile: {
              type: 'string',
              enum: ['SENIOR', 'JUNIOR'],
              description: 'Perfil del agente',
              default: 'SENIOR',
            },
            has_finder: {
              type: 'boolean',
              description: 'Hay finder/referidor externo',
              default: false,
            },
            milestone: {
              type: 'string',
              enum: ['OPENING', 'MANAGEMENT', 'CLOSING', 'FULL'],
              description: 'Hito alcanzado (para cálculo parcial)',
              default: 'FULL',
            },
          },
          required: ['property_price'],
        },
      },
      {
        name: 'check_nda_status',
        description: 'Verifica si un inversor tiene NDA firmado y vigente.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor',
            },
            investor_email: {
              type: 'string',
              description: 'Email del inversor (alternativo)',
            },
          },
        },
      },
      {
        name: 'analyze_document',
        description: 'Analiza un documento (PDF, imagen) usando IA visual. Extrae información clave.',
        parameters: {
          type: 'object',
          properties: {
            document_url: {
              type: 'string',
              description: 'URL pública del documento',
            },
            document_type: {
              type: 'string',
              enum: ['ID', 'PROOF_OF_RESIDENCE', 'PROPERTY_DEED', 'FINANCIAL_STATEMENT', 'NDA', 'CONTRACT', 'OTHER'],
              description: 'Tipo de documento',
            },
            analysis_purpose: {
              type: 'string',
              description: 'Qué información buscar en el documento',
            },
          },
          required: ['document_url', 'document_type'],
        },
      },
      {
        name: 'classify_investor',
        description: 'Clasifica a un inversor según la metodología Piedras Preciosas + DISC de Alea.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor',
            },
            observations: {
              type: 'string',
              description: 'Observaciones sobre el inversor (comunicación, comportamiento, preferencias)',
            },
          },
          required: ['investor_id', 'observations'],
        },
      },
      {
        name: 'process_inbox_email',
        description: 'Procesa un email recibido y lo clasifica como lead, inversor, inmue™,人或 manda™rio. Genera sugerencia de acción.',
        parameters: {
          type: 'object',
          properties: {
            sender_email: {
              type: 'string',
              description: 'Email del remitente',
            },
            subject: {
              type: 'string',
              description: 'Asunto del email',
            },
            body: {
              type: 'string',
              description: 'Cuerpo del email',
            },
            auto_create: {
              type: 'boolean',
              description: 'Si true, crea automáticamente en CRM si se detecta tipo válido',
              default: false,
            },
          },
          required: ['sender_email', 'body'],
        },
      },
      {
        name: 'detect_mandatario',
        description: 'Analiza texto y detecta si contiene información sobre un inmue™rio o representante legal.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Texto a analizar',
            },
            source: {
              type: 'string',
              enum: ['email', 'document', 'chat', 'note'],
              description: 'Fuente del texto',
              default: 'email',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'create_mandatario',
        description: 'Crea un nuevo inmue™rio en el CRM con los datos extraídos.',
        parameters: {
          type: 'object',
          properties: {
            full_name: {
              type: 'string',
              description: 'Nombre completo dellande™rio',
            },
            company_name: {
              type: 'string',
              description: 'Nombre de empresa (si aplica)',
            },
            email: {
              type: 'string',
              description: 'Email profesional',
            },
            phone: {
              type: 'string',
              description: 'Teléfono de contacto',
            },
            mandate_type: {
              type: 'string',
              enum: ['EXCLUSIVE', 'SHARED', 'OPEN'],
              description: 'Tipo de mandato',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Etiquetas para categorizar',
            },
          },
          required: ['full_name', 'email'],
        },
      },
      {
        name: 'get_inbox_summary',
        description: 'Obtiene un resumen de la bandeja de entrada IAI: emails pendientes, aprobaciones, rechazos, y estadísticas.',
        parameters: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              enum: ['all', 'pending', 'approved', 'rejected'],
              description: 'Filtrar por estado',
              default: 'all',
            },
            days_back: {
              type: 'number',
              description: 'Días hacia atrás a consultar',
              default: 7,
            },
          },
        },
      },
      {
        name: 'get_mandates',
        description: 'Lista mandatos con filtros por estado, tipo, inmueble™rio ou propiedad.',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['active', 'expired', 'pending', 'cancelled'],
              description: 'Estado del mandato',
            },
            mandate_type: {
              type: 'string',
              enum: ['EXCLUSIVE', 'SHARED', 'OPEN'],
              description: 'Tipo de mandato',
            },
            property_id: {
              type: 'string',
              description: 'Filtrar por propiedad',
            },
            limit: {
              type: 'number',
              description: 'Límite de resultados',
              default: 20,
            },
          },
        },
      },
      {
        name: 'create_mandate',
        description: 'Crea un nuevo mandato de representación.',
        parameters: {
          type: 'object',
          properties: {
            property_id: {
              type: 'string',
              description: 'ID de la propiedad asociada',
            },
            mandatario_id: {
              type: 'string',
              description: 'ID del inmueble™rio',
            },
            mandate_type: {
              type: 'string',
              enum: ['EXCLUSIVE', 'SHARED', 'OPEN'],
              description: 'Tipo de exclusivity',
            },
            start_date: {
              type: 'string',
              description: 'Fecha de inicio (ISO format)',
            },
            end_date: {
              type: 'string',
              description: 'Fecha de fin (ISO format)',
            },
            commission_rate: {
              type: 'number',
              description: 'Tasa de comisión (decimal, ej: 0.05 para 5%)',
            },
            notes: {
              type: 'string',
              description: 'Notas adicionales',
            },
          },
          required: ['mandatario_id', 'mandate_type'],
        },
      },
      {
        name: 'update_mandate',
        description: 'Actualiza el estado ou términos de un mandato.',
        parameters: {
          type: 'object',
          properties: {
            mandate_id: {
              type: 'string',
              description: 'ID del mandato',
            },
            status: {
              type: 'string',
              enum: ['active', 'expired', 'pending', 'cancelled'],
              description: 'Nuevo estado',
            },
            end_date: {
              type: 'string',
              description: 'Nueva fecha de fin',
            },
            commission_rate: {
              type: 'number',
              description: 'Nueva tasa de comisión',
            },
            notes: {
              type: 'string',
              description: 'Notas actualizadas',
            },
          },
          required: ['mandate_id'],
        },
      },
      {
        name: 'check_mandate_exclusivity',
        description: 'Verifica si una propiedad tiene mandato exclusivo ou compartido y quién es el inmueble™rio.',
        parameters: {
          type: 'object',
          properties: {
            property_id: {
              type: 'string',
              description: 'ID de la propiedad',
            },
          },
          required: ['property_id'],
        },
      },
      {
        name: 'get_mandate_alerts',
        description: 'Obtiene alertas de mandatos: próximos a vencer, expirados, ou sin renew.',
        parameters: {
          type: 'object',
          properties: {
            days_until_expiry: {
              type: 'number',
              description: 'Días hasta vencimiento para alertar',
              default: 30,
            },
          },
        },
      },
      {
        name: 'classify_investor_behavior',
        description: 'Clasifica a un inversor según el sistema Piedras Preciosas baseado en observaciones de comportamento y comunicación.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor (opcional si se pasa email)',
            },
            investor_email: {
              type: 'string',
              description: 'Email del inversor (alternativo a ID)',
            },
            observations: {
              type: 'string',
              description: 'Observaciones sobre el inversor: cómo comunica, qué prioriza, cómo toma decisiones, estilo de comunicación',
            },
            save_to_profile: {
              type: 'boolean',
              description: 'Si true, guarda la clasificación en el perfil del inversor',
              default: false,
            },
          },
          required: ['observations'],
        },
      },
      {
        name: 'get_investor_piedra',
        description: 'Obtiene la clasificación Piedras Preciosas de un inversor y sugiere estrategia de comunicación.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor',
            },
            investor_email: {
              type: 'string',
              description: 'Email del inversor (alternativo)',
            },
          },
        },
      },
      {
        name: 'suggest_investor_approach',
        description: 'Sugiere cómo abordar a un inversor específico baseado en su clasificación Piedras Preciosas.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor',
            },
            investor_email: {
              type: 'string',
              description: 'Email del inversor (alternativo)',
            },
            situation: {
              type: 'string',
              enum: ['initial_contact', 'follow_up', 'closing', 'presentation', 'negotiation'],
              description: 'Situación actual con el inversor',
            },
          },
        },
      },
      {
        name: 'match_investor_preferences',
        description: 'Analiza qué propiedades ou oportunidades matchean melhor com o perfil de un inversor.',
        parameters: {
          type: 'object',
          properties: {
            investor_id: {
              type: 'string',
              description: 'ID del inversor',
            },
            investor_email: {
              type: 'string',
              description: 'Email del inversor (alternativo)',
            },
            property_criteria: {
              type: 'object',
              description: 'Criterios de propiedad si no se tiene inversor',
              properties: {
                budget_min: { type: 'number' },
                budget_max: { type: 'number' },
                location: { type: 'string' },
                asset_type: { type: 'string' },
              },
            },
            limit: {
              type: 'number',
              description: 'Número máximo de resultados',
              default: 5,
            },
          },
        },
      },
      {
        name: 'get_time',
        description: 'Obtiene la fecha y hora actual del sistema.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    ];
  },
};

export function getToolByName(name: string): ToolDefinition | undefined {
  const allTools = HermesTools.getDefaultTools();
  return allTools.find(t => t.name === name);
}
