/**
 * Alea Memory System
 * MemPalace-inspired architecture on InsForge
 * 
 * Wing → Room → Drawer hierarchy:
 * - Wing: investor, property, or project
 * - Room: specific topic within wing (facts, events, preferences, advice)
 * - Drawer: verbatim content storage
 */

import { createAuthenticatedClient } from './insforge-server';

export type HallType = 'facts' | 'events' | 'discoveries' | 'preferences' | 'advice';
export type ContentType = 'text' | 'decision' | 'quote' | 'code' | 'event';

export interface MemoryWing {
    id: string;
    name: string;
    wing_type: 'investor' | 'property' | 'project' | 'session' | 'general';
    entity_id?: string;
    description?: string;
    keywords: string[];
    created_at: string;
    updated_at: string;
}

export interface MemoryRoom {
    id: string;
    wing_id: string;
    name: string;
    hall_type: HallType;
    description?: string;
    metadata: Record<string, any>;
    created_at: string;
}

export interface MemoryDrawer {
    id: string;
    room_id: string;
    content: string;
    content_type: ContentType;
    source?: string;
    source_id?: string;
    metadata: Record<string, any>;
    importance_score: number;
    created_at: string;
}

export interface MemoryContext {
    hall_type: HallType;
    room_name: string;
    content: string;
    created_at: string;
}

export interface KnowledgeTriple {
    id: string;
    entity_subject: string;
    relationship: string;
    entity_object: string;
    valid_from: string;
    valid_until?: string;
    confidence_score: number;
    source?: string;
    metadata: Record<string, any>;
}

/**
 * Generate wing name for investor
 */
export function investorWingName(investorId: string, investorEmail?: string): string {
    if (investorEmail) {
        const clean = investorEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `investor_${clean}`;
    }
    return `investor_${investorId}`;
}

/**
 * Generate wing name for property
 */
export function propertyWingName(propertyId: string, propertyTitle?: string): string {
    if (propertyTitle) {
        const clean = propertyTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
        return `property_${clean}`;
    }
    return `property_${propertyId}`;
}

/**
 * Generate wing name for session/conversation
 */
export function sessionWingName(sessionId: string): string {
    return `session_${sessionId}`;
}

/**
 * Add memory drawer with auto wing/room creation
 */
export async function addMemory(
    wingName: string,
    roomName: string,
    hallType: HallType,
    content: string,
    options: {
        source?: string;
        sourceId?: string;
        contentType?: ContentType;
        metadata?: Record<string, any>;
        importanceScore?: number;
        wingType?: 'investor' | 'property' | 'project' | 'session' | 'general';
    } = {}
): Promise<{ id: string } | null> {
    const client = await createAuthenticatedClient();
    
    const {
        source = 'manual',
        sourceId,
        contentType = 'text',
        metadata = {},
        importanceScore = 50,
        wingType = 'general'
    } = options;

    try {
        // Get or create wing
        let { data: wing } = await client
            .database
            .from('memory_wings')
            .select('id')
            .eq('name', wingName)
            .single();

        if (!wing) {
            const { data: newWing, error: wingError } = await client
                .database
                .from('memory_wings')
                .insert({ name: wingName, wing_type: wingType, keywords: [] })
                .select('id')
                .single();
            if (wingError || !newWing) {
                console.error('Error creating wing:', wingError);
                return null;
            }
            wing = newWing;
        }

        // Get or create room
        let { data: room } = await client
            .database
            .from('memory_rooms')
            .select('id')
            .eq('wing_id', wing.id)
            .eq('name', roomName)
            .single();

        if (!room) {
            const { data: newRoom, error: roomError } = await client
                .database
                .from('memory_rooms')
                .insert({ wing_id: wing.id, name: roomName, hall_type: hallType })
                .select('id')
                .single();
            if (roomError || !newRoom) {
                console.error('Error creating room:', roomError);
                return null;
            }
            room = newRoom;
        }

        // Create drawer
        const { data: drawer, error: drawerError } = await client
            .database
            .from('memory_drawers')
            .insert({
                room_id: room.id,
                content,
                content_type: contentType,
                importance_score: importanceScore,
                source,
                source_id: sourceId,
                metadata
            })
            .select('id')
            .single();

        if (drawerError) {
            console.error('Error creating drawer:', drawerError);
            return null;
        }

        return { id: drawer?.id || '' };
    } catch (err) {
        console.error('Error in addMemory:', err);
        return null;
    }
}

/**
 * Get memory context for AI consumption
 */
export async function getMemoryContext(
    wingName: string,
    limit: number = 10
): Promise<MemoryContext[]> {
    const client = await createAuthenticatedClient();

    try {
        // Get wing by name
        const { data: wing } = await client
            .database
            .from('memory_wings')
            .select('id')
            .eq('name', wingName)
            .single();

        if (!wing) return [];

        // Get rooms for this wing
        const { data: rooms } = await client
            .database
            .from('memory_rooms')
            .select('id, name, hall_type')
            .eq('wing_id', wing.id);

        if (!rooms || rooms.length === 0) return [];

        const roomIds = rooms.map((r: any) => r.id);

        // Get drawers from all rooms
        const { data: drawers } = await client
            .database
            .from('memory_drawers')
            .select('*, room:memory_rooms(name, hall_type)')
            .in('room_id', roomIds)
            .order('importance_score', { ascending: false })
            .limit(limit);

        if (!drawers) return [];

        return drawers.map((d: any) => ({
            id: d.id,
            content: d.content,
            hall_type: d.room?.hall_type || 'facts',
            room_name: d.room?.name || '',
            importance_score: d.importance_score,
            created_at: d.created_at
        }));
    } catch (err) {
        console.error('Error in getMemoryContext:', err);
        return [];
    }
}

/**
 * Get all wings
 */
export async function getWings(options: {
    type?: 'investor' | 'property' | 'project' | 'session';
    entityId?: string;
} = {}): Promise<MemoryWing[]> {
    const client = await createAuthenticatedClient();
    const { type, entityId } = options;

    try {
        let query = client.database.from('memory_wings').select('*');
        
        if (type) {
            query = query.eq('wing_type', type);
        }
        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) {
            console.error('Error getting wings:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in getWings:', err);
        return [];
    }
}

/**
 * Get rooms within a wing
 */
export async function getRooms(wingId: string): Promise<MemoryRoom[]> {
    const client = await createAuthenticatedClient();

    try {
        const { data, error } = await client
            .database
            .from('memory_rooms')
            .select('*')
            .eq('wing_id', wingId)
            .order('name');

        if (error) {
            console.error('Error getting rooms:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in getRooms:', err);
        return [];
    }
}

/**
 * Get drawers within a room
 */
export async function getDrawers(
    roomId: string,
    options: {
        limit?: number;
        contentType?: ContentType;
    } = {}
): Promise<MemoryDrawer[]> {
    const client = await createAuthenticatedClient();
    const { limit = 50, contentType } = options;

    try {
        let query = client
            .database
            .from('memory_drawers')
            .select('*')
            .eq('room_id', roomId)
            .order('importance_score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (contentType) {
            query = query.eq('content_type', contentType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error getting drawers:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in getDrawers:', err);
        return [];
    }
}

/**
 * Delete a drawer
 */
export async function deleteDrawer(drawerId: string): Promise<boolean> {
    const client = await createAuthenticatedClient();

    try {
        const { error } = await client
            .database
            .from('memory_drawers')
            .delete()
            .eq('id', drawerId);

        if (error) {
            console.error('Error deleting drawer:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error in deleteDrawer:', err);
        return false;
    }
}

/**
 * Search memory across all wings
 */
export async function searchMemory(
    query: string,
    options: {
        wingName?: string;
        hallType?: HallType;
        limit?: number;
    } = {}
): Promise<MemoryDrawer[]> {
    const client = await createAuthenticatedClient();
    const { wingName, hallType, limit = 20 } = options;

    try {
        // Use text search on content
        let q = client
            .database
            .from('memory_drawers')
            .select('*, room:memory_rooms(name, hall_type, wing:memory_wings(name))')
            .order('importance_score', { ascending: false })
            .limit(limit);

        // Note: InsForge text search syntax may vary
        // Using ilike for basic search
        q = q.ilike('content', `%${query}%`);

        const { data, error } = await q;

        if (error) {
            console.error('Error searching memory:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in searchMemory:', err);
        return [];
    }
}

/**
 * Add knowledge graph triple
 */
export async function addKnowledgeTriple(
    subject: string,
    relationship: string,
    object: string,
    options: {
        validFrom?: string;
        validUntil?: string;
        confidenceScore?: number;
        source?: string;
        metadata?: Record<string, any>;
    } = {}
): Promise<{ id: string } | null> {
    const client = await createAuthenticatedClient();
    
    const {
        validFrom = new Date().toISOString(),
        validUntil,
        confidenceScore = 100,
        source = 'manual',
        metadata = {}
    } = options;

    try {
        const { data, error } = await client
            .database
            .from('memory_knowledge_graph')
            .insert({
                entity_subject: subject,
                relationship,
                entity_object: object,
                valid_from: validFrom,
                valid_until: validUntil,
                confidence_score: confidenceScore,
                source,
                metadata
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error adding knowledge triple:', error);
            return null;
        }

        return { id: data.id };
    } catch (err) {
        console.error('Error in addKnowledgeTriple:', err);
        return null;
    }
}

/**
 * Query knowledge graph for entity
 */
export async function queryKnowledgeGraph(
    subject: string,
    options: {
        relationship?: string;
        asOf?: string;
    } = {}
): Promise<KnowledgeTriple[]> {
    const client = await createAuthenticatedClient();
    const { relationship, asOf } = options;

    try {
        let q = client
            .database
            .from('memory_knowledge_graph')
            .select('*')
            .eq('entity_subject', subject)
            .order('confidence_score', { ascending: false });

        if (relationship) {
            q = q.eq('relationship', relationship);
        }

        const { data, error } = await q;

        if (error) {
            console.error('Error querying knowledge graph:', error);
            return [];
        }

        // Filter by validity date if asOf is specified
        let results = data || [];
        if (asOf) {
            const asOfDate = new Date(asOf);
            results = results.filter((r: KnowledgeTriple) => {
                const validFrom = new Date(r.valid_from);
                const validUntil = r.valid_until ? new Date(r.valid_until) : null;
                return validFrom <= asOfDate && (!validUntil || validUntil >= asOfDate);
            });
        }

        return results;
    } catch (err) {
        console.error('Error in queryKnowledgeGraph:', err);
        return [];
    }
}

/**
 * Get timeline for entity
 */
export async function getEntityTimeline(subject: string): Promise<KnowledgeTriple[]> {
    const client = await createAuthenticatedClient();

    try {
        const { data, error } = await client
            .database
            .from('memory_knowledge_graph')
            .select('*')
            .eq('entity_subject', subject)
            .order('valid_from', { ascending: true });

        if (error) {
            console.error('Error getting entity timeline:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in getEntityTimeline:', err);
        return [];
    }
}

/**
 * Invalidate a knowledge triple (mark as ended)
 */
export async function invalidateKnowledgeTriple(
    subject: string,
    relationship: string,
    endedAt: string
): Promise<boolean> {
    const client = await createAuthenticatedClient();

    try {
        const { error } = await client
            .database
            .from('memory_knowledge_graph')
            .update({ valid_until: endedAt })
            .eq('entity_subject', subject)
            .eq('relationship', relationship)
            .is('valid_until', null);

        if (error) {
            console.error('Error invalidating triple:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error in invalidateKnowledgeTriple:', err);
        return false;
    }
}

/**
 * Format memory context for AI consumption (like MemPalace wake-up)
 */
export async function formatMemoryContextForAI(
    wingName: string,
    options: {
        includeWing?: boolean;
        includeTimeline?: boolean;
        maxItems?: number;
    } = {}
): Promise<string> {
    const client = await createAuthenticatedClient();
    const { includeWing = true, includeTimeline = false, maxItems = 10 } = options;

    const contextParts: string[] = [];

    // Get wing info
    if (includeWing) {
        const { data: wing } = await client.database
            .from('memory_wings')
            .select('*')
            .eq('name', wingName)
            .single();
        
        if (wing) {
            contextParts.push(`WING: ${wing.wing_type.toUpperCase()}`);
            if (wing.description) {
                contextParts.push(`Description: ${wing.description}`);
            }
        }
    }

    // Get memory context
    const memories = await getMemoryContext(wingName, maxItems);
    
    if (memories.length > 0) {
        contextParts.push('\nMEMORIES:');
        
        const byHall: Record<string, string[]> = {};
        for (const mem of memories) {
            if (!byHall[mem.hall_type]) {
                byHall[mem.hall_type] = [];
            }
            byHall[mem.hall_type].push(`  [${mem.room_name}] ${mem.content}`);
        }
        
        for (const [hall, items] of Object.entries(byHall)) {
            contextParts.push(`\n## ${hall.toUpperCase()}`);
            contextParts.push(items.join('\n'));
        }
    }

    // Get timeline if requested
    if (includeTimeline) {
        const entityName = wingName.replace('investor_', '').replace('property_', '');
        const timeline = await getEntityTimeline(entityName);
        
        if (timeline.length > 0) {
            contextParts.push('\n## TIMELINE');
            for (const t of timeline) {
                const validUntil = t.valid_until ? ` - ${t.valid_until.split('T')[0]}` : ' (current)';
                contextParts.push(`  ${t.valid_from.split('T')[0]}${validUntil}: ${t.entity_subject} ${t.relationship} ${t.entity_object}`);
            }
        }
    }

    return contextParts.join('\n');
}

/**
 * Store conversation memory from Pelayo Chat
 */
export async function storePelayoConversation(
    investorId: string,
    investorEmail: string,
    message: string,
    response: string,
    analysis?: {
        intent?: string;
        entity?: string;
        confidence?: number;
    }
): Promise<void> {
    const wingName = investorWingName(investorId, investorEmail);

    // Store the exchange
    await addMemory(wingName, 'conversations', 'events', 
        `User: ${message}\nPelayo: ${response}`,
        {
            source: 'pelayo_chat',
            contentType: 'event',
            importanceScore: analysis?.confidence && analysis.confidence > 0.7 ? 70 : 50
        }
    );

    // If AI detected a decision, store as fact
    if (analysis?.intent === 'decision' || analysis?.intent === 'create') {
        await addMemory(wingName, 'decisions', 'facts',
            `Decision recorded: ${message} → ${response}`,
            {
                source: 'pelayo_chat',
                contentType: 'decision',
                importanceScore: 80
            }
        );
    }

    // If entity detected (investor, property, lead), create knowledge triple
    if (analysis?.entity && analysis?.entity !== 'none') {
        await addKnowledgeTriple(
            investorEmail || investorId,
            'discussed_about',
            analysis.entity,
            {
                source: 'pelayo_chat',
                confidenceScore: Math.round((analysis.confidence || 0.5) * 100)
            }
        );
    }
}

/**
 * Get investor preferences from memory
 */
export async function getInvestorPreferences(
    investorId: string,
    investorEmail: string
): Promise<{
    budget_min?: number;
    budget_max?: number;
    preferred_locations?: string[];
    preferred_types?: string[];
    investment_timeline?: string;
}> {
    const wingName = investorWingName(investorId, investorEmail);
    const memories = await getMemoryContext(wingName, 20);

    // Parse preferences from memory
    const prefs: any = {};

    for (const mem of memories) {
        const content = mem.content.toLowerCase();
        
        if (content.includes('presupuesto') || content.includes('budget')) {
            const match = content.match(/(\d+[\d,.]*)\s*(m|m€|millones?)/i);
            if (match) {
                const value = parseFloat(match[1].replace(',', '.')) * 1000000;
                if (!prefs.budget_max || value > prefs.budget_max) {
                    prefs.budget_max = value;
                }
            }
        }
        
        if (content.includes('ubicación') || content.includes('location') || content.includes('zona')) {
            const locations = content.match(/(madrid|barcelona|ibiza|sevilla|valencia|palacio|gran vía)/gi);
            if (locations) {
                prefs.preferred_locations = [...new Set(locations.map(l => l.toLowerCase()))];
            }
        }
    }

    return prefs;
}
