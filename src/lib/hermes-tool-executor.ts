/**
 * Hermes Tool Executor - Bridge between Hermes Tools and InsForge
 * 
 * Executes tool calls from MiniMax M2.7 against:
 * - InsForge CRM (leads, investors, properties, etc.)
 * - MemPalace Memory System
 * - Agenda Actions
 */

import { createAuthenticatedClient } from './insforge-server';
import type { ToolCall, ToolResult } from './hermes-types';

export interface ToolExecutorContext {
  userId: string;
  userEmail?: string;
  token?: string;
}

export async function executeHermesTool(
  toolCall: ToolCall,
  context: ToolExecutorContext
): Promise<any> {
  const { name, arguments: argsStr } = toolCall.function;
  const args = JSON.parse(argsStr || '{}');

  const client = await createAuthenticatedClient(context.token);

  switch (name) {
    case 'crm_query':
      return executeCRMQuery(client, args);
    
    case 'crm_create':
      return executeCRMCreate(client, args);
    
    case 'crm_update':
      return executeCRMUpdate(client, args);
    
    case 'crm_get_investor_profile':
      return executeGetInvestorProfile(client, args);
    
    case 'search_properties':
      return executeSearchProperties(client, args);
    
    case 'memory_store':
      return executeMemoryStore(client, args, context);
    
    case 'memory_recall':
      return executeMemoryRecall(client, args, context);
    
    case 'memory_search':
      return executeMemorySearch(client, args);
    
    case 'agenda_create_action':
      return executeAgendaCreateAction(client, args, context);
    
    case 'agenda_get_pending':
      return executeAgendaGetPending(client, args, context);
    
    case 'agenda_complete_action':
      return executeAgendaCompleteAction(client, args);
    
    case 'calculate_commission':
      return executeCalculateCommission(args);
    
    case 'check_nda_status':
      return executeCheckNDAStatus(client, args);
    
    case 'detect_asset':
      return executeDetectAsset(client, args);
    
    case 'match_investors_to_asset':
      return executeMatchInvestors(client, args);
    
    case 'classify_asset':
      return executeClassifyAsset(client, args);
    
    case 'analyze_investment_opportunity':
      return executeAnalyzeOpportunity(client, args);
    
    case 'get_off_market_opportunities':
      return executeGetOffMarket(client, args);
    
    case 'analyze_document':
      return { message: 'Document analysis not yet implemented via tools' };
    
    case 'classify_investor':
      return { message: 'Investor classification not yet implemented via tools' };
    
    case 'process_inbox_email':
      return executeProcessInboxEmail(client, args, context);
    
    case 'detect_mandatario':
      return executeDetectMandatario(client, args);
    
    case 'create_mandatario':
      return executeCreateMandatario(client, args);
    
    case 'get_inbox_summary':
      return executeGetInboxSummary(client, args);
    
    case 'get_mandates':
      return executeGetMandates(client, args);
    
    case 'create_mandate':
      return executeCreateMandate(client, args);
    
    case 'update_mandate':
      return executeUpdateMandate(client, args);
    
    case 'check_mandate_exclusivity':
      return executeCheckMandateExclusivity(client, args);
    
    case 'get_mandate_alerts':
      return executeGetMandateAlerts(client, args);
    
    case 'classify_investor_behavior':
      return executeClassifyInvestorBehavior(client, args);
    
    case 'get_investor_piedra':
      return executeGetInvestorPiedra(client, args);
    
    case 'suggest_investor_approach':
      return executeSuggestInvestorApproach(client, args);
    
    case 'match_investor_preferences':
      return executeMatchInvestorPreferences(client, args);
    
    case 'get_time':
      return { 
        datetime: new Date().toISOString(),
        timezone: 'Europe/Madrid',
        formatted: new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
      };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function executeCRMQuery(client: any, args: any) {
  const { table, filters = {}, limit = 10 } = args;
  
  let query = client.database.from(table).select('*').limit(limit);
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.is_off_market !== undefined) query = query.eq('is_off_market', filters.is_off_market);
  if (filters.kyc_status) query = query.eq('kyc_status', filters.kyc_status);
  if (filters.piedra_personalidad) query = query.eq('piedra_personalidad', filters.piedra_personalidad);
  if (filters.asset_type) query = query.eq('asset_type', filters.asset_type);
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error, count } = await query;
  
  if (error) throw new Error(`CRM Query error: ${error.message}`);
  
  return { table, data: data || [], count: count || data?.length || 0 };
}

async function executeCRMCreate(client: any, args: any) {
  const { table, data } = args;
  
  if (!data) throw new Error('No data provided for create');
  
  const { data: result, error } = await client.database.from(table).insert(data).select().single();
  
  if (error) throw new Error(`CRM Create error: ${error.message}`);
  
  return { success: true, id: result.id, data: result };
}

async function executeCRMUpdate(client: any, args: any) {
  const { table, id, data } = args;
  
  if (!id) throw new Error('No ID provided for update');
  if (!data) throw new Error('No data provided for update');
  
  const { data: result, error } = await client.database
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(`CRM Update error: ${error.message}`);
  
  return { success: true, data: result };
}

async function executeGetInvestorProfile(client: any, args: any) {
  const { investor_id, investor_email } = args;
  
  let query = client.database.from('investors').select('*');
  
  if (investor_id) {
    query = query.eq('id', investor_id);
  } else if (investor_email) {
    query = query.eq('email', investor_email);
  } else {
    throw new Error('Either investor_id or investor_email required');
  }
  
  const { data: investor, error } = await query.single();
  
  if (error) throw new Error(`Investor not found: ${error.message}`);
  
  const { data: classifications } = await client
    .database.from('investor_classifications')
    .select('*')
    .eq('investor_id', investor.id)
    .order('created_at', { ascending: false })
    .limit(1);
  
  const { data: interests } = await client
    .database.from('investor_interests')
    .select('*, property:properties(*)')
    .eq('investor_id', investor.id);
  
  return {
    investor,
    classification: classifications?.[0] || null,
    interests: interests || []
  };
}

async function executeSearchProperties(client: any, args: any) {
  const { location, budget_min, budget_max, asset_type, min_sqm, is_off_market = true } = args;
  
  let query = client.database
    .from('properties')
    .select('id, title, asset_type, price, size_sqm, is_off_market, thumbnail_url, created_at')
    .eq('is_published', true);
  
  if (is_off_market) query = query.eq('is_off_market', true);
  if (location) query = query.ilike('address', `%${location}%`);
  if (budget_min) query = query.gte('price', budget_min);
  if (budget_max) query = query.lte('price', budget_max);
  if (asset_type) query = query.eq('asset_type', asset_type);
  if (min_sqm) query = query.gte('size_sqm', min_sqm);
  
  query = query.order('created_at', { ascending: false }).limit(20);
  
  const { data, error } = await query;
  
  if (error) throw new Error(`Property search error: ${error.message}`);
  
  return { count: data?.length || 0, properties: data || [] };
}

async function executeMemoryStore(client: any, args: any, context: ToolExecutorContext) {
  const { wing_type = 'general', entity_id, entity_email, room_name, hall_type, content, importance = 50 } = args;
  
  let wingName = `general_${Date.now()}`;
  
  if (entity_email) {
    wingName = `investor_${entity_email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  } else if (entity_id) {
    wingName = wing_type === 'investor' ? `investor_${entity_id}` : `${wing_type}_${entity_id}`;
  }
  
  let { data: wing } = await client.database.from('memory_wings').select('id').eq('name', wingName).single();
  
  if (!wing) {
    const { data: newWing, error: wingError } = await client
      .database.from('memory_wings')
      .insert({ name: wingName, wing_type, keywords: [] })
      .select('id')
      .single();
    
    if (wingError) throw new Error(`Memory wing error: ${wingError.message}`);
    wing = newWing;
  }
  
  let { data: room } = await client
    .database.from('memory_rooms')
    .select('id')
    .eq('wing_id', wing.id)
    .eq('name', room_name)
    .single();
  
  if (!room) {
    const { data: newRoom, error: roomError } = await client
      .database.from('memory_rooms')
      .insert({ wing_id: wing.id, name: room_name, hall_type })
      .select('id')
      .single();
    
    if (roomError) throw new Error(`Memory room error: ${roomError.message}`);
    room = newRoom;
  }
  
  const { data: drawer, error: drawerError } = await client
    .database.from('memory_drawers')
    .insert({
      room_id: room.id,
      content,
      content_type: 'text',
      importance_score: importance,
      source: 'hermes_pelayo',
    })
    .select('id')
    .single();
  
  if (drawerError) throw new Error(`Memory drawer error: ${drawerError.message}`);
  
  return { success: true, memory_id: drawer.id, wing: wingName };
}

async function executeMemoryRecall(client: any, args: any, context: ToolExecutorContext) {
  const { entity_email, entity_id, wing_name, hall_type, limit = 10 } = args;
  
  let wingName = wing_name;
  
  if (!wingName) {
    if (entity_email) {
      wingName = `investor_${entity_email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    } else if (entity_id) {
      wingName = `investor_${entity_id}`;
    } else {
      throw new Error('Need entity_email, entity_id, or wing_name');
    }
  }
  
  const { data: wing } = await client.database.from('memory_wings').select('id').eq('name', wingName).single();
  
  if (!wing) return { memories: [], message: 'No memories found' };
  
  let query = client
    .database.from('memory_drawers')
    .select('*, room:memory_rooms(name, hall_type)')
    .eq('room_id', wing.id)
    .order('importance_score', { ascending: false })
    .limit(limit);
  
  if (hall_type) {
    query = query.eq('room:memory_rooms.hall_type', hall_type);
  }
  
  const { data: drawers, error } = await query;
  
  if (error) throw new Error(`Memory recall error: ${error.message}`);
  
  return { memories: drawers || [] };
}

async function executeMemorySearch(client: any, args: any) {
  const { query, limit = 20 } = args;
  
  const { data, error } = await client
    .database.from('memory_drawers')
    .select('*, room:memory_rooms(name, hall_type, wing:memory_wings(name))')
    .ilike('content', `%${query}%`)
    .order('importance_score', { ascending: false })
    .limit(limit);
  
  if (error) throw new Error(`Memory search error: ${error.message}`);
  
  return { results: data || [], count: data?.length || 0 };
}

async function executeAgendaCreateAction(client: any, args: any, context: ToolExecutorContext) {
  const { title, description, action_type, priority = 'medium', due_date, lead_id, assigned_agent_id } = args;
  
  const actionData: any = {
    title,
    action_type,
    priority,
    status: 'pending',
    due_date,
    assigned_agent_id: assigned_agent_id || context.userId,
  };
  
  if (description) actionData.description = description;
  if (lead_id) actionData.lead_id = lead_id;
  
  const { data, error } = await client.database.from('agenda_actions').insert(actionData).select().single();
  
  if (error) throw new Error(`Agenda create error: ${error.message}`);
  
  return { success: true, action: data };
}

async function executeAgendaGetPending(client: any, args: any, context: ToolExecutorContext) {
  const { lead_id, agent_id, include_overdue = true } = args;
  
  const targetAgentId = agent_id || context.userId;
  
  let query = client
    .database.from('agenda_actions')
    .select('*, lead:leads(id, name, status)')
    .eq('assigned_agent_id', targetAgentId)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true });
  
  if (lead_id) query = query.eq('lead_id', lead_id);
  
  const { data: actions, error } = await query;
  
  if (error) throw new Error(`Agenda query error: ${error.message}`);
  
  const now = new Date();
  const overdue = actions?.filter((a: any) => new Date(a.due_date) < now) || [];
  const upcoming = actions?.filter((a: any) => new Date(a.due_date) >= now) || [];
  
  return {
    overdue: include_overdue ? overdue : [],
    upcoming,
    total: actions?.length || 0,
  };
}

async function executeAgendaCompleteAction(client: any, args: any) {
  const { action_id, outcome = 'COMPLETED', notes } = args;
  
  const updateData: any = {
    status: outcome === 'CANCELLED' ? 'cancelled' : 'completed',
    completed_at: new Date().toISOString(),
  };
  
  if (outcome) updateData.outcome = outcome;
  if (notes) updateData.completion_notes = notes;
  
  const { data, error } = await client
    .database.from('agenda_actions')
    .update(updateData)
    .eq('id', action_id)
    .select()
    .single();
  
  if (error) throw new Error(`Agenda complete error: ${error.message}`);
  
  return { success: true, action: data };
}

function executeCalculateCommission(args: any) {
  const { property_price, agent_profile = 'SENIOR', has_finder = false, milestone = 'FULL' } = args;
  
  const TOTAL_COMMISSION_RATE = 0.05;
  const ALEA_SHARE = 0.40;
  const EXECUTION_POOL = 0.60;
  
  const total_commission = property_price * TOTAL_COMMISSION_RATE;
  const alea_share = total_commission * ALEA_SHARE;
  const execution_pool = total_commission * EXECUTION_POOL;
  
  let agent_share: number;
  let finder_share = 0;
  
  if (has_finder) {
    agent_share = execution_pool * 0.75;
    finder_share = execution_pool * 0.25;
  } else {
    agent_share = agent_profile === 'SENIOR' ? execution_pool : execution_pool * 0.60;
  }
  
  const breakdown = {
    opening: total_commission * 0.25,
    management: total_commission * 0.50,
    closing: total_commission * 0.25,
  };
  
  if (milestone !== 'FULL') {
    const multiplier = milestone === 'OPENING' ? 0.25 : milestone === 'MANAGEMENT' ? 0.50 : 0.25;
    return {
      property_price,
      milestone,
      commission_due: total_commission * multiplier,
      breakdown,
      message: `Commission for ${milestone} milestone: ${(total_commission * multiplier).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`,
    };
  }
  
  return {
    property_price,
    total_commission,
    alea_share,
    execution_pool,
    agent_share,
    finder_share: has_finder ? finder_share : undefined,
    breakdown,
  };
}

async function executeCheckNDAStatus(client: any, args: any) {
  const { investor_id, investor_email } = args;
  
  if (!investor_id && !investor_email) {
    throw new Error('Need investor_id or investor_email');
  }
  
  let query = client.database.from('investors').select('id, full_name, email, nda_status, nda_signed_at');
  
  if (investor_id) {
    query = query.eq('id', investor_id);
  } else {
    query = query.eq('email', investor_email);
  }
  
  const { data: investor, error } = await query.single();
  
  if (error || !investor) {
    return { has_nda: false, message: 'Investor not found' };
  }
  
  const hasNDA = investor.nda_status === 'signed' || investor.nda_status === 'active';
  const signedAt = investor.nda_signed_at || null;
  
  return {
    has_nda: hasNDA,
    nda_status: investor.nda_status,
    nda_signed_at: signedAt,
    investor: { id: investor.id, name: investor.full_name, email: investor.email },
  };
}

async function executeDetectAsset(client: any, args: any) {
  const { text, source = 'chat' } = args;
  
  if (!text || text.length < 20) {
    return { detected: false, reason: 'Text too short to analyze' };
  }
  
  const indicators = {
    price_mentioned: /(\d{1,3}[\d,.]*\s*(€|EUR|millones?|M€|kEUR)|[\d,.]+\s*(MM€|M€))/i.test(text),
    location_mentioned: /(Madrid|Barcelona|Ibiza|Marbella|Mallorca|Sevilla|Valencia|Costa del Sol|Zona Prime)/i.test(text),
    asset_type_mentioned: /(Hotel|Edificio|Suelo|Retail|Oficinas|Logístico|Propiedad|Activo|Inmueble|Local|Vivienda|Piso|Apartamento|Villa|Chalet)/i.test(text),
    size_mentioned: /(\d+\s*m²|\d+\s*mt2|\d+\s*metros|\d+\s*hectáreas|\d+\s*Has)/i.test(text),
    vendor_mentioned: /(vendedor|propietario|vende|vendo|off-market|exclusividad|mandato)/i.test(text),
  };
  
  const matchScore = Object.values(indicators).filter(Boolean).length;
  
  if (matchScore < 2) {
    return { detected: false, indicators, match_score: matchScore, reason: 'No clear asset indicators found' };
  }
  
  const extractedData: any = {};
  
  const priceMatch = text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:€|EUR)/i) || text.match(/(\d+(?:\.\d{3})*)\s*(?:M€|millones?)/i);
  if (priceMatch) {
    const rawPrice = priceMatch[1].replace(/\./g, '').replace(',', '.');
    extractedData.price = rawPrice.includes('M') || priceMatch[0].includes('mill') 
      ? parseFloat(rawPrice) * 1000000 
      : parseFloat(rawPrice);
  }
  
  const locationMatch = text.match(/(?:en|ubicad[oa]|situad[oa]|Madrid|Barcelona|Ibiza|Marbella|Mallorca|Sevilla|Valencia)[^,.\n]{0,50}/i);
  if (locationMatch) {
    extractedData.location = locationMatch[0].trim();
  }
  
  const sizeMatch = text.match(/(\d+(?:\.\d{3})?)\s*(?:m²|mt2|metros|hectáreas|Ha)/i);
  if (sizeMatch) {
    extractedData.size_sqm = parseFloat(sizeMatch[1].replace(/\./g, ''));
  }
  
  for (const type of ['Hotel', 'Edificio', 'Suelo', 'Retail', 'Oficinas', 'Logístico', 'Vivienda', 'Villa', 'Local', 'Apartamento']) {
    if (text.toLowerCase().includes(type.toLowerCase())) {
      extractedData.asset_type = type;
      break;
    }
  }
  
  return {
    detected: true,
    match_score: matchScore,
    indicators,
    extracted_data: extractedData,
    source,
    recommendation: matchScore >= 3 ? 'HIGH_PRIORITY' : 'WORTH_REVIEWING',
  };
}

async function executeMatchInvestors(client: any, args: any) {
  const { asset_id, asset_data, limit = 5 } = args;
  
  if (!asset_id && !asset_data) {
    throw new Error('Need asset_id or asset_data');
  }
  
  let propertyData = asset_data;
  
  if (asset_id) {
    const { data: property } = await client
      .database.from('properties')
      .select('*')
      .eq('id', asset_id)
      .single();
    if (property) propertyData = property;
  }
  
  if (!propertyData) {
    return { matches: [], message: 'Asset not found' };
  }
  
  const { data: investors } = await client
    .database.from('investors')
    .select('id, full_name, email, budget_min, budget_max, preferred_locations, piedra_personalidad, kyc_status')
    .eq('kyc_status', 'approved')
    .limit(50);
  
  if (!investors || investors.length === 0) {
    return { matches: [], message: 'No qualified investors found' };
  }
  
  const matches = investors
    .map((inv: any) => {
      let score = 0;
      const reasons: string[] = [];
      
      if (inv.budget_min && propertyData.price) {
        if (propertyData.price >= inv.budget_min) {
          score += 30;
          reasons.push('Within budget');
        }
      } else {
        score += 15;
      }
      
      if (inv.budget_max && propertyData.price) {
        if (propertyData.price <= inv.budget_max) {
          score += 30;
          reasons.push('Under max budget');
        }
      } else {
        score += 15;
      }
      
      if (inv.preferred_locations && propertyData.location) {
        const hasLocation = inv.preferred_locations.some((loc: string) => 
          propertyData.location?.toLowerCase().includes(loc.toLowerCase())
        );
        if (hasLocation) {
          score += 25;
          reasons.push('Preferred location');
        }
      }
      
      if (inv.piedra_personalidad) {
        score += 10;
        reasons.push(`Piedra: ${inv.piedra_personalidad}`);
      }
      
      return { investor: inv, score, reasons };
    })
    .filter((m: any) => m.score >= 30)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);
  
  return {
    matches,
    total_candidates: investors.length,
    asset_price: propertyData.price,
  };
}

async function executeClassifyAsset(client: any, args: any) {
  const { asset_data } = args;
  
  if (!asset_data) {
    throw new Error('asset_data required');
  }
  
  const { title = '', description = '', price, address = '' } = asset_data;
  const combinedText = `${title} ${description} ${address}`.toLowerCase();
  
  const typeRules: Record<string, string[]> = {
    'Hotel': ['hotel', 'hostal', 'resort', 'apartamentos turísticos', 'turismo'],
    'Edificio': ['edificio', 'bloque', 'inmueble', 'patrimonial', 'oficinas', 'corporativo'],
    'Suelo': ['suelo', 'terreno', 'parcela', 'land', 'promoción', 'edificabilidad'],
    'Retail': ['local', 'tienda', 'centro comercial', 'high street', 'retail', 'nave'],
    'Oficinas': ['oficina', 'coworking', 'despacho', 'corporativo', 'business'],
    'Logístico': ['logístico', 'almacén', 'nave industrial', 'centro logístico', 'warehouse'],
  };
  
  let classification = 'Otro';
  let confidence = 0.3;
  let matchedIndicators: string[] = [];
  
  for (const [type, keywords] of Object.entries(typeRules)) {
    const matches = keywords.filter(k => combinedText.includes(k));
    if (matches.length > 0) {
      const typeConfidence = 0.5 + (matches.length * 0.1);
      if (typeConfidence > confidence) {
        confidence = typeConfidence;
        classification = type;
        matchedIndicators = matches;
      }
    }
  }
  
  const priceRange = price ? (() => {
    if (price >= 10000000) return 'PREMIUM';
    if (price >= 2500000) return 'HIGH';
    if (price >= 500000) return 'MID';
    return 'STANDARD';
  })() : 'UNDEFINED';
  
  return {
    classification,
    confidence: Math.min(confidence, 0.95),
    matched_indicators: matchedIndicators,
    price_range: priceRange,
    recommended_actions: [
      confidence >= 0.7 ? 'HIGH_PRIORITY_REVIEW' : 'NEEDS_MORE_DATA',
      'Cross-reference with market data',
      'Check NDA status before presenting to investors',
    ],
  };
}

async function executeAnalyzeOpportunity(client: any, args: any) {
  const { asset_id, asset_data, investor_profile } = args;
  
  let propertyData = asset_data;
  
  if (asset_id) {
    const { data: property } = await client
      .database.from('properties')
      .select('*')
      .eq('id', asset_id)
      .single();
    if (property) propertyData = property;
  }
  
  if (!propertyData && !asset_data) {
    throw new Error('Need asset_id or asset_data');
  }
  
  const price = propertyData?.price || asset_data?.price || 0;
  const location = propertyData?.location || asset_data?.location || '';
  const asset_type = propertyData?.asset_type || asset_data?.asset_type || 'Otro';
  const size_sqm = propertyData?.size_sqm || asset_data?.size_sqm || 0;
  
  const pricePerSqm = size_sqm > 0 ? price / size_sqm : 0;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  if (price >= 5000000) {
    strengths.push('Alto patrimonio - segmento premium');
  }
  if (pricePerSqm < 3000 && size_sqm > 500) {
    strengths.push('Buen precio por m² para el tipo de activo');
  }
  if (location.toLowerCase().includes('madrid') || location.toLowerCase().includes('barcelona')) {
    strengths.push('Ubicación en mercado primario');
    recommendations.push('Solicitar NDA antes de mostrar detalles');
  }
  
  if (!size_sqm || size_sqm < 200) {
    weaknesses.push('Metros cuadrados limitados');
  }
  if (price > 10000000) {
    recommendations.push('Considerar inversores FAMILY_OFFICE');
  }
  
  const milestoneBreakdown = {
    opening: price * 0.05 * 0.25,
    management: price * 0.05 * 0.50,
    closing: price * 0.05 * 0.25,
  };
  
  return {
    asset: {
      title: propertyData?.title || asset_data?.title || 'Unknown',
      price,
      location,
      asset_type,
      size_sqm,
      price_per_sqm: pricePerSqm,
    },
    investment_grade: price >= 5000000 ? 'A' : price >= 1000000 ? 'B' : 'C',
    strengths,
    weaknesses,
    recommendations,
    commission_estimate: {
      total: price * 0.05,
      alea_share: price * 0.05 * 0.40,
      execution_pool: price * 0.05 * 0.60,
      milestones: milestoneBreakdown,
    },
    next_steps: [
      'Verify asset documentation',
      'Check vendor exclusivity',
      'Prepare blind listing',
      'Match with qualified investors',
    ],
    investor_profile_alignment: investor_profile ? {
      budget_match: investor_profile.budget_max >= price && (!investor_profile.budget_min || investor_profile.budget_min <= price),
      location_match: !investor_profile.preferred_locations || investor_profile.preferred_locations.some((l: string) => location.toLowerCase().includes(l.toLowerCase())),
    } : null,
  };
}

async function executeGetOffMarket(client: any, args: any) {
  const { budget_min, budget_max, location, asset_type, min_sqm } = args;
  
  let query = client
    .database.from('properties')
    .select('id, title, asset_type, price, size_sqm, address, is_off_market, created_at, thumbnail_url')
    .eq('is_off_market', true)
    .eq('is_published', true);
  
  if (budget_min) query = query.gte('price', budget_min);
  if (budget_max) query = query.lte('price', budget_max);
  if (location) query = query.ilike('address', `%${location}%`);
  if (asset_type) query = query.eq('asset_type', asset_type);
  if (min_sqm) query = query.gte('size_sqm', min_sqm);
  
  query = query.order('created_at', { ascending: false }).limit(20);
  
  const { data: properties, error } = await query;
  
  if (error) throw new Error(`Off-market search error: ${error.message}`);
  
  const opportunities = (properties || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    asset_type: p.asset_type,
    price: p.price,
    size_sqm: p.size_sqm,
    location_hint: p.address ? `Zona prime de ${p.address.split(',').pop()?.trim() || location || 'España'}` : null,
    is_off_market: true,
    listed_days_ago: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  }));
  
  return {
    count: opportunities.length,
    opportunities,
    filters_applied: { budget_min, budget_max, location, asset_type, min_sqm },
    blind_listing_note: 'Las ubicaciones exactas se revelan solo a inversores con NDA firmado',
  };
}

async function executeProcessInboxEmail(client: any, args: any, context: ToolExecutorContext) {
  const { sender_email, subject, body, auto_create = false } = args;
  
  if (!body || body.length < 20) {
    return { processed: false, reason: 'Email body too short to analyze' };
  }
  
  const indicators = {
    is_investor: /(inversor|inversión|patrimonio| фонд|family office|wealth)/i.test(body),
    is_property: /(propiedad|activo|inmueble|venta|vendo|edificio|hotel|suelo)/i.test(body),
    is_mandatario: /(mandatario|representante|abogado|notaría|代理|mandate)/i.test(body),
    has_budget: /(\d+[\d,.]*\s*(€|EUR|millones?)|presupuesto|invertir\s*(?:desde|de)?\s*\d+)/i.test(body),
    has_location: /(madrid|barcelona|ibiza|marbella|mallorca|costa del sol)/i.test(body),
  };
  
  const detectedType = detectEmailType(indicators);
  
  const extractedData: any = {};
  
  const priceMatch = body.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:€|EUR)/i) || body.match(/(\d+(?:\.\d{3})*)\s*(?:M€|millones?)/i);
  if (priceMatch) {
    const rawPrice = priceMatch[1].replace(/\./g, '').replace(',', '.');
    extractedData.price = rawPrice.includes('M') || priceMatch[0].includes('mill') 
      ? parseFloat(rawPrice) * 1000000 
      : parseFloat(rawPrice);
  }
  
  const nameMatch = body.match(/(?:atentamente|saludos|un saludo|hi,|hello|buenas)\s*,?\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/m);
  if (nameMatch) {
    extractedData.name = nameMatch[1].trim();
  }
  
  const phoneMatch = body.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    extractedData.phone = phoneMatch[0].trim();
  }
  
  for (const loc of ['Madrid', 'Barcelona', 'Ibiza', 'Marbella', 'Mallorca', 'Sevilla', 'Valencia']) {
    if (body.toLowerCase().includes(loc.toLowerCase())) {
      extractedData.location = loc;
      break;
    }
  }
  
  let suggestionData: any = {
    original_email_subject: subject || '',
    original_email_body: body,
    sender_email,
    suggestion_type: detectedType,
    extracted_data: extractedData,
    status: 'pending',
    ai_interpretation: `Email detectado como: ${detectedType.toUpperCase()}. ${generateEmailSummary(indicators, detectedType)}`,
  };
  
  const { data: suggestion, error: suggestionError } = await client
    .database.from('iai_inbox_suggestions')
    .insert(suggestionData)
    .select()
    .single();
  
  if (suggestionError) {
    console.error('Error creating IAI suggestion:', suggestionError);
  }
  
  let crmCreated = null;
  if (auto_create && suggestion) {
    crmCreated = await tryAutoCreateInCRM(client, detectedType, sender_email, extractedData);
  }
  
  return {
    processed: true,
    detected_type: detectedType,
    indicators,
    extracted_data: extractedData,
    suggestion_id: suggestion?.id || null,
    auto_created: crmCreated,
    next_action: getRecommendedAction(detectedType, indicators),
  };
}

function detectEmailType(indicators: any): string {
  if (indicators.is_mandatario && !indicators.is_investor && !indicators.is_property) {
    return 'mandatario';
  }
  if (indicators.is_investor && indicators.has_budget) {
    return 'investor';
  }
  if (indicators.is_property) {
    return 'property';
  }
  if (indicators.is_investor) {
    return 'investor';
  }
  return 'unknown';
}

function generateEmailSummary(indicators: any, type: string): string {
  const parts: string[] = [];
  
  if (indicators.has_budget) parts.push('💰 Indica presupuesto');
  if (indicators.has_location) parts.push('📍 Ubicación mencionada');
  if (type === 'investor') parts.push('👤 Posible inversor');
  if (type === 'property') parts.push('🏠 Posible propiedad');
  if (type === 'mandatario') parts.push('⚖️ Posible inmue™rio');
  
  return parts.length > 0 ? parts.join('. ') : 'Sin indicadores claros';
}

function getRecommendedAction(type: string, indicators: any): string {
  if (type === 'investor') {
    return indicators.has_budget ? 'Crear lead + agendar contacto inicial' : 'Solicitar más información sobre presupuesto';
  }
  if (type === 'property') {
    return 'Revisar documentación + verificar exclusividad';
  }
  if (type === 'mandatario') {
    return 'Verificar representación legal + crear inmue™rio';
  }
  return 'Revisar manualmente';
}

async function tryAutoCreateInCRM(client: any, type: string, email: string, data: any): Promise<any> {
  if (type === 'investor') {
    const { data: existing } = await client
      .database.from('investors')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return { already_exists: true, id: existing.id };
    }
    
    const { data: newInvestor, error } = await client
      .database.from('investors')
      .insert({
        email,
        full_name: data.name || email.split('@')[0],
        phone: data.phone || null,
        budget_min: data.price ? data.price * 0.7 : null,
        budget_max: data.price || null,
        kyc_status: 'pending',
        source: 'email_intelligence',
      })
      .select('id')
      .single();
    
    if (!error) {
      return { created: true, id: newInvestor.id, type: 'investor' };
    }
  }
  
  return { created: false };
}

async function executeDetectMandatario(client: any, args: any) {
  const { text, source = 'email' } = args;
  
  if (!text || text.length < 30) {
    return { detected: false, reason: 'Text too short to analyze' };
  }
  
  const indicators = {
    has_name: /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/.test(text),
    has_company: /(?:S\.L\.|S\.A\.|Ltd\.|GmbH|SAS|SARL|Immobilien|Representación|Mandatario|CEO|Partner|Director)/i.test(text),
    has_contact: /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|[\w.-]+@[\w.-]+\.\w+/.test(text),
    has_mandate_keywords: /(mandato|exclusividad|representación|autorización|poder|代理|mandate)/i.test(text),
    has_legal_context: /(abogado|notario|jurídico|legal|asesor|lawyer|attorney)/i.test(text),
  };
  
  const matchScore = Object.values(indicators).filter(Boolean).length;
  
  if (matchScore < 2) {
    return { detected: false, indicators, match_score: matchScore };
  }
  
  const extractedData: any = {};
  
  const nameMatch = text.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})/);
  if (nameMatch) extractedData.name = nameMatch[1];
  
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) extractedData.email = emailMatch[0];
  
  const phoneMatch = text.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) extractedData.phone = phoneMatch[0];
  
  for (const companyType of ['S.L.', 'S.A.', 'Ltd.', 'GmbH', 'SAS', 'SARL']) {
    if (text.includes(companyType)) {
      extractedData.company_type = companyType;
      const companyMatch = text.match(new RegExp(`([A-Z][a-záéíóúñA-Z0-9\\s]+)\\s*${companyType.replace('.', '\\.')}`));
      if (companyMatch) extractedData.company_name = companyMatch[1].trim();
      break;
    }
  }
  
  let mandateType = 'UNKNOWN';
  if (/exclusividad\s*(?:total|absoluta|plena)/i.test(text)) mandateType = 'EXCLUSIVE';
  else if (/compartido|no exclusivo/i.test(text)) mandateType = 'SHARED';
  else if (/abierto|semiexclusivo/i.test(text)) mandateType = 'OPEN';
  
  return {
    detected: matchScore >= 3,
    match_score: matchScore,
    indicators,
    extracted_data: extractedData,
    mandate_type: mandateType,
    recommendation: matchScore >= 4 ? 'CREATE_MANDATARIO' : 'NEEDS_REVIEW',
    source,
  };
}

async function executeCreateMandatario(client: any, args: any) {
  const { full_name, company_name, email, phone, mandate_type = 'OPEN', labels = [] } = args;
  
  if (!full_name || !email) {
    throw new Error('full_name y email son requeridos');
  }
  
  const { data: existing } = await client
    .database.from('mandatorios')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existing) {
    return { already_exists: true, id: existing.id };
  }
  
  const { data: newMandatario, error } = await client
    .database.from('mandatorios')
    .insert({
      full_name,
      company_name: company_name || null,
      email,
      phone: phone || null,
      mandate_type,
      labels,
      status: 'active',
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating mandatario: ${error.message}`);
  }
  
  return {
    created: true,
    id: newMandatario.id,
    mandatario: newMandatario,
  };
}

async function executeGetInboxSummary(client: any, args: any) {
  const { filter = 'all', days_back = 7 } = args;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days_back);
  
  let query = client
    .database.from('iai_inbox_suggestions')
    .select('*', { count: 'exact' })
    .gte('created_at', cutoffDate.toISOString());
  
  if (filter !== 'all') {
    query = query.eq('status', filter);
  }
  
  const { data: suggestions, count, error } = await query;
  
  if (error) {
    throw new Error(`Error fetching inbox summary: ${error.message}`);
  }
  
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  for (const s of suggestions || []) {
    byType[s.suggestion_type] = (byType[s.suggestion_type] || 0) + 1;
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }
  
  const recentHighPriority = (suggestions || [])
    .filter((s: any) => s.status === 'pending' && s.extracted_data?.price >= 1000000)
    .slice(0, 5)
    .map((s: any) => ({
      id: s.id,
      type: s.suggestion_type,
      subject: s.original_email_subject,
      sender: s.sender_email,
      price: s.extracted_data?.price,
    }));
  
  return {
    total: count || 0,
    by_type: byType,
    by_status: byStatus,
    recent_high_priority: recentHighPriority,
    days_back,
    filter_applied: filter,
  };
}

async function executeGetMandates(client: any, args: any) {
  const { status, mandate_type, property_id, limit = 20 } = args;
  
  let query = client
    .database.from('mandates')
    .select('*, property:properties(id, title), mandatorio:mandatorios(full_name, company_name)')
    .limit(limit);
  
  if (status) query = query.eq('status', status);
  if (mandate_type) query = query.eq('mandate_type', mandate_type);
  if (property_id) query = query.eq('property_id', property_id);
  
  query = query.order('created_at', { ascending: false });
  
  const { data: mandates, error } = await query;
  
  if (error) throw new Error(`Error fetching mandates: ${error.message}`);
  
  const mandatesWithDays = (mandates || []).map((m: any) => {
    const endDate = m.end_date ? new Date(m.end_date) : null;
    const now = new Date();
    const daysUntilExpiry = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    return {
      id: m.id,
      mandate_type: m.mandate_type,
      status: m.status,
      start_date: m.start_date,
      end_date: m.end_date,
      commission_rate: m.commission_rate,
      property: m.property,
      mandatorio: m.mandatorio,
      days_until_expiry: daysUntilExpiry,
      is_expiring_soon: daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0,
      is_expired: daysUntilExpiry !== null && daysUntilExpiry < 0,
    };
  });
  
  return {
    count: mandatesWithDays.length,
    mandates: mandatesWithDays,
    filters_applied: { status, mandate_type, property_id },
  };
}

async function executeCreateMandate(client: any, args: any) {
  const { property_id, mandatorio_id, mandate_type, start_date, end_date, commission_rate, notes } = args;
  
  if (!mandatorio_id || !mandate_type) {
    throw new Error('mandatorio_id y mandate_type son requeridos');
  }
  
  const mandateData: any = {
    mandatorio_id,
    mandate_type,
    status: 'active',
    start_date: start_date || new Date().toISOString().split('T')[0],
  };
  
  if (property_id) mandateData.property_id = property_id;
  if (end_date) mandateData.end_date = end_date;
  if (commission_rate) mandateData.commission_rate = commission_rate;
  if (notes) mandateData.notes = notes;
  
  const { data: mandate, error } = await client
    .database.from('mandates')
    .insert(mandateData)
    .select()
    .single();
  
  if (error) throw new Error(`Error creating mandate: ${error.message}`);
  
  return {
    created: true,
    id: mandate.id,
    mandate: mandate,
  };
}

async function executeUpdateMandate(client: any, args: any) {
  const { mandate_id, status, end_date, commission_rate, notes } = args;
  
  if (!mandate_id) throw new Error('mandate_id es requerido');
  
  const updateData: any = {};
  if (status) updateData.status = status;
  if (end_date) updateData.end_date = end_date;
  if (commission_rate) updateData.commission_rate = commission_rate;
  if (notes) updateData.notes = notes;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('No se proporcionaron datos para actualizar');
  }
  
  const { data: mandate, error } = await client
    .database.from('mandates')
    .update(updateData)
    .eq('id', mandate_id)
    .select()
    .single();
  
  if (error) throw new Error(`Error updating mandate: ${error.message}`);
  
  return {
    updated: true,
    mandate,
  };
}

async function executeCheckMandateExclusivity(client: any, args: any) {
  const { property_id } = args;
  
  if (!property_id) throw new Error('property_id es requerido');
  
  const { data: mandates, error } = await client
    .database.from('mandates')
    .select('*, mandatorio:mandatorios(full_name, company_name, email)')
    .eq('property_id', property_id)
    .eq('status', 'active');
  
  if (error) throw new Error(`Error checking exclusivity: ${error.message}`);
  
  if (!mandates || mandates.length === 0) {
    return {
      has_mandate: false,
      exclusivity_type: null,
      mandatorios: [],
      message: 'No hay mandato para esta propiedad',
    };
  }
  
  const hasExclusive = mandates.some((m: any) => m.mandate_type === 'EXCLUSIVE');
  const hasShared = mandates.some((m: any) => m.mandate_type === 'SHARED');
  const hasOpen = mandates.some((m: any) => m.mandate_type === 'OPEN');
  
  let exclusivityType = 'OPEN';
  if (hasExclusive) exclusivityType = 'EXCLUSIVE';
  else if (hasShared) exclusivityType = 'SHARED';
  
  const exclusivityInfo = {
    has_mandate: true,
    exclusivity_type: exclusivityType,
    total_mandates: mandates.length,
    has_exclusive: hasExclusive,
    has_shared: hasShared,
    has_open: hasOpen,
    mandatorios: mandates.map((m: any) => ({
      id: m.mandatorio_id,
      name: m.mandatorio?.full_name,
      company: m.mandatorio?.company_name,
      email: m.mandatorio?.email,
      mandate_type: m.mandate_type,
    })),
  };
  
  return exclusivityInfo;
}

async function executeGetMandateAlerts(client: any, args: any) {
  const { days_until_expiry = 30 } = args;
  
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days_until_expiry);
  
  const { data: expiringMandates, error: expiringError } = await client
    .database.from('mandates')
    .select('*, property:properties(id, title), mandatorio:mandatorios(full_name)')
    .eq('status', 'active')
    .gte('end_date', now.toISOString().split('T')[0])
    .lte('end_date', futureDate.toISOString().split('T')[0])
    .order('end_date', { ascending: true });
  
  if (expiringError) throw new Error(`Error fetching expiring mandates: ${expiringError.message}`);
  
  const { data: expiredMandates, error: expiredError } = await client
    .database.from('mandates')
    .select('*, property:properties(id, title), mandatorio:mandatorios(full_name)')
    .eq('status', 'active')
    .lt('end_date', now.toISOString().split('T')[0]);
  
  if (expiredError) throw new Error(`Error fetching expired mandates: ${expiredError.message}`);
  
  const { data: noDateMandates, error: noDateError } = await client
    .database.from('mandates')
    .select('*, property:properties(id, title), mandatorio:mandatorios(full_name)')
    .eq('status', 'active')
    .is('end_date', null);
  
  if (noDateError) throw new Error(`Error fetching mandates without date: ${noDateError.message}`);
  
  const expiringList = (expiringMandates || []).map((m: any) => {
    const endDate = new Date(m.end_date);
    const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: m.id,
      property_title: m.property?.title,
      mandatorio_name: m.mandatorio?.full_name,
      mandate_type: m.mandate_type,
      end_date: m.end_date,
      days_until_expiry: daysUntil,
      urgency: daysUntil <= 7 ? 'HIGH' : daysUntil <= 14 ? 'MEDIUM' : 'LOW',
    };
  });
  
  const expiredList = (expiredMandates || []).map((m: any) => ({
    id: m.id,
    property_title: m.property?.title,
    mandatorio_name: m.mandatorio?.full_name,
    mandate_type: m.mandate_type,
    end_date: m.end_date,
    days_expired: Math.ceil((now.getTime() - new Date(m.end_date).getTime()) / (1000 * 60 * 60 * 24)),
  }));
  
  const noDateList = (noDateMandates || []).map((m: any) => ({
    id: m.id,
    property_title: m.property?.title,
    mandatorio_name: m.mandatorio?.full_name,
    mandate_type: m.mandate_type,
    start_date: m.start_date,
    warning: 'Sin fecha de fin definida',
  }));
  
  return {
    summary: {
      expiring_soon: expiringList.length,
      expired: expiredList.length,
      missing_end_date: noDateList.length,
      total_alerts: expiringList.length + expiredList.length + noDateList.length,
    },
    expiring_soon: expiringList,
    expired: expiredList,
    missing_end_date: noDateList,
    days_until_expiry_threshold: days_until_expiry,
  };
}

const PIEDRAS_PRECIOUS_INFO = {
  ZAFIRO: {
    name: 'Zafiro',
    emoji: '💎',
    motivation: 'Diversión',
    characteristics: ['Sociable', 'Activo', 'Competitivo', 'Historias'],
    communication: ['Alegre', 'Casual', 'Visual', 'Storytelling'],
    closing: ['Simple', 'General vision', 'Muchas historias', 'Tono casual'],
  },
  PERLA: {
    name: 'Perla',
    emoji: '🔮',
    motivation: 'Causa (ayudar)',
    characteristics: ['Calmado', 'Leal', 'Orientado a valores', 'Oyente'],
    communication: ['Suave', 'Personal', 'Escuchar', 'Touche personal'],
    closing: ['Apoyar', 'ESCUCHAR', 'Familia', 'Agradecer'],
  },
  ESMERALDA: {
    name: 'Esmeralda',
    emoji: '💚',
    motivation: 'Análisis',
    characteristics: ['Detallista', 'Organizado', 'Puntual', 'Directo'],
    communication: ['Datos', 'Proceso', 'Profesional', 'Preguntas específicas'],
    closing: ['Validar', 'Integridad', 'Ahorro', '"Si no sé, te llamo en 2h"'],
  },
  RUBI: {
    name: 'Rubí',
    emoji: '❤️',
    motivation: 'Desafío (ganar)',
    characteristics: ['Competitivo', 'Ambicioso', 'Resultados', 'Control'],
    communication: ['Eficiente', 'Resultados', 'Preciso', 'Moderno'],
    closing: ['Rápido', 'Orientar a resultados', 'Primer lugar', 'Validar ideas'],
  },
};

function analyzePiedraFromObservations(observations: string): { piedra: string; confidence: number; signals: string[] } {
  const obs = observations.toLowerCase();
  const signals: string[] = [];
  let scores: Record<string, number> = { ZAFIRO: 0, PERLA: 0, ESMERALDA: 0, RUBI: 0 };
  
  if (/(sociable|amistoso|charla|evento|reunión social)/.test(obs)) {
    scores.ZAFIRO += 3;
    signals.push('Comportamiento social');
  }
  if (/(rápido|eficiencia|resultado|ganar|competitivo|impatient)/.test(obs)) {
    scores.RUBI += 3;
    signals.push('Orientado a resultados');
  }
  if (/(detalle|datos|claro|organizado|proceso|puntual|pregunta específica)/.test(obs)) {
    scores.ESMERALDA += 3;
    signals.push('Análisis detallado');
  }
  if (/(calmado|leal|escuchar|familia|tranquilo|seguro|valores)/.test(obs)) {
    scores.PERLA += 3;
    signals.push('Orientado a relaciones');
  }
  if (/(ayudar|causa|causal|apoyar|comunidad)/.test(obs)) {
    scores.PERLA += 2;
    signals.push('Motivación de causa');
  }
  if (/(desafío|ganar|desta car|ambición)/.test(obs)) {
    scores.RUBI += 2;
    signals.push('Motivación de desafío');
  }
  if (/(diversión|disfrutar|entretenimiento)/.test(obs)) {
    scores.ZAFIRO += 2;
    signals.push('Motivación de diversión');
  }
  if (/(análisis|analizar|estudiar|investigar)/.test(obs)) {
    scores.ESMERALDA += 2;
    signals.push('Motivación de análisis');
  }
  
  const piedra = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const confidence = totalScore > 0 ? Math.min(scores[piedra] / totalScore + 0.3, 0.95) : 0.5;
  
  return { piedra, confidence, signals };
}

async function executeClassifyInvestorBehavior(client: any, args: any) {
  const { investor_id, investor_email, observations, save_to_profile = false } = args;
  
  if (!observations) {
    throw new Error('observations es requerido');
  }
  
  const { piedra, confidence, signals } = analyzePiedraFromObservations(observations);
  const piedraInfo = PIEDRAS_PRECIOUS_INFO[piedra as keyof typeof PIEDRAS_PRECIOUS_INFO];
  
  let investor: any = null;
  
  if (investor_id || investor_email) {
    let query = client.database.from('investors').select('*');
    if (investor_id) query = query.eq('id', investor_id);
    else query = query.eq('email', investor_email);
    
    const { data } = await query.single();
    investor = data;
  }
  
  let classification: any = {
    piedra_primaria: piedra,
    piedra_emoji: piedraInfo.emoji,
    piedra_motivation: piedraInfo.motivation,
    confidence,
    signals_detected: signals,
    characteristics: piedraInfo.characteristics,
    communication_style: piedraInfo.communication,
    closing_strategy: piedraInfo.closing,
    recommended_follow_up: piedra === 'RUBI' ? 'Rapido y eficiente' : piedra === 'ESMERALDA' ? 'Datos y proceso' : piedra === 'PERLA' ? 'Personal y listening' : 'Casual y Relación',
  };
  
  if (save_to_profile && investor) {
    await client
      .database.from('investors')
      .update({ piedra_personalidad: piedra })
      .eq('id', investor.id);
    
    await client.database.from('investor_classifications').insert({
      investor_id: investor.id,
      piedra_primaria: piedra,
      confidence_score: confidence,
      observations: observations,
      classified_by: 'pelayo_hermes',
    });
    
    classification.saved_to_profile = true;
    classification.investor_id = investor.id;
  }
  
  return classification;
}

async function executeGetInvestorPiedra(client: any, args: any) {
  const { investor_id, investor_email } = args;
  
  if (!investor_id && !investor_email) {
    throw new Error('investor_id ou investor_email es requerido');
  }
  
  let query = client.database.from('investors').select('*');
  if (investor_id) query = query.eq('id', investor_id);
  else query = query.eq('email', investor_email);
  
  const { data: investor, error } = await query.single();
  
  if (error || !investor) {
    return { found: false, message: 'Investor not found' };
  }
  
  const piedra = investor.piedra_personalidad || null;
  const piedraInfo = piedra ? PIEDRAS_PRECIOUS_INFO[piedra as keyof typeof PIEDRAS_PRECIOUS_INFO] : null;
  
  const { data: classifications } = await client
    .database.from('investor_classifications')
    .select('*')
    .eq('investor_id', investor.id)
    .order('created_at', { ascending: false })
    .limit(1);
  
  const latestClassification = classifications?.[0] || null;
  
  return {
    found: true,
    investor: {
      id: investor.id,
      name: investor.full_name,
      email: investor.email,
    },
    piedra: piedra,
    piedra_info: piedraInfo,
    has_classification: !!piedra,
    latest_classification: latestClassification,
  };
}

async function executeSuggestInvestorApproach(client: any, args: any) {
  const { investor_id, investor_email, situation = 'follow_up' } = args;
  
  let investor: any = null;
  
  if (investor_id || investor_email) {
    let query = client.database.from('investors').select('*');
    if (investor_id) query = query.eq('id', investor_id);
    else query = query.eq('email', investor_email);
    
    const { data } = await query.single();
    investor = data;
  }
  
  const piedra = investor?.piedra_personalidad || 'ZAFIRO';
  const piedraInfo = PIEDRAS_PRECIOUS_INFO[piedra as keyof typeof PIEDRAS_PRECIOUS_INFO];
  
  const thingsToAvoidByPiedra: Record<string, string[]> = {
    ZAFIRO: ['No ser muy técnico', 'No ser muy formal', 'No dejar mucho tiempo en silencio'],
    PERLA: ['No presionar', 'No ser agresivo', 'No saltarse el proceso'],
    ESMERALDA: ['No omitir datos', 'No ser vago', 'No presionar'],
    RUBI: ['No alargarte', 'No storytelling excesivo', 'No dar rodeos'],
  };
  
  const approachBySituation: Record<string, Record<string, string>> = {
    initial_contact: {
      ZAFIRO: 'Llamada casual, rompehielo, preguntarle por eventos recientes',
      PERLA: 'Email personal, mostrar interés genuino, no precipitar',
      ESMERALDA: 'Email profesional, adjuntar info relevante, permitir tiempo',
      RUBI: 'Breve y directo, ir al grano, decir cuánto tiempo ocupa',
    },
    follow_up: {
      ZAFIRO: 'WhatsApp informal, compartir algo interesante, sin presión',
      PERLA: 'Llamada de check-in, escuchar cómo está, mostrar apoyo',
      ESMERALDA: 'Email con actualización de datos, informe breve',
      RUBI: 'Mensaje corto: "Hay novedades, te interesa?"',
    },
    presentation: {
      ZAFIRO: 'Presentación visual, historias de éxito, ambiente relaxed',
      PERLA: 'Presentación personal, cómo beneficia a su familia/valores',
      ESMERALDA: 'Informe detallado, datos, projections, Q&A estructurado',
      RUBI: 'Resumen ejecutivo, números clave, siguiente paso claro',
    },
    closing: {
      ZAFIRO: 'Crear urgencia suave, "última oportunidad", cerrar con historia',
      PERLA: 'Paciencia, dejar que decida, mostrarle que le apoyas',
      ESMERALDA: 'Verificar objeciones, data, comparativas, garantías',
      RUBI: 'Cerrar ya, "qué necesitas para decidir hoy?", bonus por velocidad',
    },
    negotiation: {
      ZAFIRO: 'Negociación amigable, encontrar Win-Win, flexibilidad',
      PERLA: 'Negociación lenta, demostrar valor a largo plazo',
      ESMERALDA: 'Data-driven negotiation, todo por escrito, garantías',
      RUBI: 'Negociación eficiente, defender posición, no ceder fácil',
    },
  };
  
  return {
    investor: investor ? { id: investor.id, name: investor.full_name, piedra } : null,
    situation,
    piedra_info: piedraInfo,
    suggested_approach: approachBySituation[situation]?.[piedra] || approachBySituation[situation]?.ZAFIRO,
    communication_tips: piedraInfo?.communication,
    closing_tips: piedraInfo?.closing,
    things_to_avoid: thingsToAvoidByPiedra[piedra] || [],
  };
}

async function executeMatchInvestorPreferences(client: any, args: any) {
  const { investor_id, investor_email, property_criteria, limit = 5 } = args;
  
  let investor: any = null;
  let criteria: any = {};
  
  if (investor_id || investor_email) {
    let query = client.database.from('investors').select('*');
    if (investor_id) query = query.eq('id', investor_id);
    else query = query.eq('email', investor_email);
    
    const { data } = await query.single();
    investor = data;
    
    if (investor) {
      criteria = {
        budget_min: investor.budget_min || 0,
        budget_max: investor.budget_max || 50000000,
        preferred_locations: investor.preferred_locations || [],
        piedra: investor.piedra_personalidad || 'ZAFIRO',
      };
    }
  } else if (property_criteria) {
    criteria = property_criteria;
  } else {
    throw new Error('Se requiere investor_id/email ou property_criteria');
  }
  
  let query = client
    .database.from('properties')
    .select('id, title, asset_type, price, size_sqm, address, is_off_market')
    .eq('is_published', true)
    .limit(limit * 2);
  
  if (criteria.budget_min) query = query.gte('price', criteria.budget_min);
  if (criteria.budget_max) query = query.lte('price', criteria.budget_max);
  
  const { data: properties, error } = await query;
  
  if (error) throw new Error(`Error fetching properties: ${error.message}`);
  
  const piedraInfo = PIEDRAS_PRECIOUS_INFO[criteria.piedra as keyof typeof PIEDRAS_PRECIOUS_INFO];
  
  const matched = (properties || [])
    .map((p: any) => {
      let score = 50;
      
      if (criteria.preferred_locations?.length > 0) {
        const hasLocation = criteria.preferred_locations.some((loc: string) => 
          p.address?.toLowerCase().includes(loc.toLowerCase())
        );
        if (hasLocation) score += 30;
      }
      
      if (p.price >= criteria.budget_min * 0.7 && p.price <= criteria.budget_max * 1.2) {
        score += 20;
      }
      
      return { property: p, score };
    })
    .filter((m: any) => m.score >= 60)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit)
    .map((m: any) => ({
      ...m.property,
      match_score: m.score,
      blind_location: m.property.address ? `Zona prime de ${m.property.address.split(',').pop()?.trim()}` : null,
    }));
  
  return {
    investor: investor ? { id: investor.id, name: investor.full_name, piedra: criteria.piedra } : null,
    matched_properties: matched,
    total_matches: matched.length,
    piedra_approach: piedraInfo ? {
      emoji: piedraInfo.emoji,
      communication: piedraInfo.communication,
      closing: piedraInfo.closing,
    } : null,
  };
}

export async function executeToolCall(
  toolCall: ToolCall,
  context: ToolExecutorContext
): Promise<ToolResult> {
  try {
    const result = await executeHermesTool(toolCall, context);
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      result,
      success: true,
    };
  } catch (error: any) {
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      result: { error: error.message },
      success: false,
      error: error.message,
    };
  }
}
