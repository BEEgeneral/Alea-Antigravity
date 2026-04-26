import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import {
    addMemory,
    getMemoryContext,
    getWings,
    getRooms,
    getDrawers,
    deleteDrawer,
    searchMemory,
    addKnowledgeTriple,
    queryKnowledgeGraph,
    getEntityTimeline,
    invalidateKnowledgeTriple,
    investorWingName,
    propertyWingName,
    sessionWingName,
    type HallType,
    type ContentType
} from '@/lib/memory';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action') || 'list_wings';
        const wingName = searchParams.get('wingName');
        const wingId = searchParams.get('wingId');
        const roomId = searchParams.get('roomId');
        const entity = searchParams.get('entity');
        const limit = parseInt(searchParams.get('limit') || '20');

        // list_wings can be called without auth for status checks
        if (action !== 'list_wings') {
            const client = await createAuthenticatedClient();
            const { data: { user } } = await client.auth.getCurrentUser();
            
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        switch (action) {
            case 'list_wings': {
                const client = await createAuthenticatedClient();
                const type = searchParams.get('type') as 'investor' | 'property' | 'project' | 'session' | null;
                const wings = await getWings({ type: type || undefined });
                return NextResponse.json({ wings });
            }

            case 'get_rooms': {
                if (!wingId) {
                    return NextResponse.json({ error: 'wingId required' }, { status: 400 });
                }
                const rooms = await getRooms(wingId);
                return NextResponse.json({ rooms });
            }

            case 'get_drawers': {
                if (!roomId) {
                    return NextResponse.json({ error: 'roomId required' }, { status: 400 });
                }
                const contentType = searchParams.get('contentType') as ContentType | null;
                const drawers = await getDrawers(roomId, { 
                    limit, 
                    contentType: contentType || undefined 
                });
                return NextResponse.json({ drawers });
            }

            case 'get_context': {
                if (!wingName) {
                    return NextResponse.json({ error: 'wingName required' }, { status: 400 });
                }
                const context = await getMemoryContext(wingName, limit);
                return NextResponse.json({ context });
            }

            case 'search': {
                const query = searchParams.get('query');
                if (!query) {
                    return NextResponse.json({ error: 'query required' }, { status: 400 });
                }
                const hallType = searchParams.get('hallType') as HallType | null;
                const results = await searchMemory(query, { 
                    wingName: wingName || undefined,
                    hallType: hallType || undefined,
                    limit 
                });
                return NextResponse.json({ results });
            }

            case 'query_kg': {
                if (!entity) {
                    return NextResponse.json({ error: 'entity required' }, { status: 400 });
                }
                const relationship = searchParams.get('relationship') || undefined;
                const asOf = searchParams.get('asOf') || undefined;
                const triples = await queryKnowledgeGraph(entity, { 
                    relationship, 
                    asOf 
                });
                return NextResponse.json({ triples });
            }

            case 'timeline': {
                if (!entity) {
                    return NextResponse.json({ error: 'entity required' }, { status: 400 });
                }
                const timeline = await getEntityTimeline(entity);
                return NextResponse.json({ timeline });
            }

            case 'investor_wing': {
                const investorId = searchParams.get('investorId');
                const investorEmail = searchParams.get('investorEmail');
                if (!investorId) {
                    return NextResponse.json({ error: 'investorId required' }, { status: 400 });
                }
                const name = investorWingName(investorId, investorEmail || undefined);
                const context = await getMemoryContext(name, limit);
                const wings = await getWings({ entityId: investorId });
                return NextResponse.json({ wingName: name, context, wings });
            }

            case 'property_wing': {
                const propertyId = searchParams.get('propertyId');
                const propertyTitle = searchParams.get('propertyTitle');
                if (!propertyId) {
                    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
                }
                const name = propertyWingName(propertyId, propertyTitle || undefined);
                const context = await getMemoryContext(name, limit);
                return NextResponse.json({ wingName: name, context });
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Memory API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const client = await createAuthenticatedClient();
        const { data: { user } } = await client.auth.getCurrentUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, ...data } = body;

        switch (action) {
            case 'add_memory': {
                const { 
                    wingName, 
                    roomName, 
                    hallType, 
                    content, 
                    source, 
                    contentType, 
                    metadata, 
                    importanceScore,
                    wingType 
                } = data;

                if (!wingName || !roomName || !hallType || !content) {
                    return NextResponse.json({ 
                        error: 'wingName, roomName, hallType, content required' 
                    }, { status: 400 });
                }

                const result = await addMemory(wingName, roomName, hallType as HallType, content, {
                    source,
                    contentType: contentType as ContentType,
                    metadata,
                    importanceScore,
                    wingType
                });

                return NextResponse.json({ success: true, id: result?.id });
            }

            case 'add_knowledge': {
                const { 
                    subject, 
                    relationship, 
                    object, 
                    validFrom, 
                    validUntil, 
                    confidenceScore, 
                    source, 
                    metadata 
                } = data;

                if (!subject || !relationship || !object) {
                    return NextResponse.json({ 
                        error: 'subject, relationship, object required' 
                    }, { status: 400 });
                }

                const result = await addKnowledgeTriple(subject, relationship, object, {
                    validFrom,
                    validUntil,
                    confidenceScore,
                    source,
                    metadata
                });

                return NextResponse.json({ success: true, id: result?.id });
            }

            case 'invalidate_knowledge': {
                const { subject, relationship, endedAt } = data;

                if (!subject || !relationship) {
                    return NextResponse.json({ 
                        error: 'subject, relationship required' 
                    }, { status: 400 });
                }

                const success = await invalidateKnowledgeTriple(
                    subject, 
                    relationship, 
                    endedAt || new Date().toISOString()
                );

                return NextResponse.json({ success });
            }

            case 'store_pelayo': {
                const { investorId, investorEmail, message, response, analysis } = data;

                if (!investorId || !message || !response) {
                    return NextResponse.json({ 
                        error: 'investorId, message, response required' 
                    }, { status: 400 });
                }

                // Import dynamically to avoid circular deps
                const { storePelayoConversation } = await import('@/lib/memory');
                await storePelayoConversation(
                    investorId, 
                    investorEmail || '', 
                    message, 
                    response, 
                    analysis
                );

                return NextResponse.json({ success: true });
            }

            case 'create_wing': {
                const { name, wingType, entityId, description, keywords } = data;

                if (!name || !wingType) {
                    return NextResponse.json({ 
                        error: 'name, wingType required' 
                    }, { status: 400 });
                }

                const { data: wing, error } = await client
                    .database
                    .from('memory_wings')
                    .insert({
                        name,
                        wing_type: wingType,
                        entity_id: entityId,
                        description,
                        keywords: keywords || []
                    })
                    .select('id')
                    .single();

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }

                return NextResponse.json({ success: true, id: wing.id });
            }

            case 'create_room': {
                const { wingId, name, hallType, description } = data;

                if (!wingId || !name || !hallType) {
                    return NextResponse.json({ 
                        error: 'wingId, name, hallType required' 
                    }, { status: 400 });
                }

                const { data: room, error } = await client
                    .database
                    .from('memory_rooms')
                    .insert({
                        wing_id: wingId,
                        name,
                        hall_type: hallType,
                        description
                    })
                    .select('id')
                    .single();

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }

                return NextResponse.json({ success: true, id: room.id });
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Memory API POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const client = await createAuthenticatedClient();
        const { data: { user } } = await client.auth.getCurrentUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const drawerId = searchParams.get('drawerId');
        const kgId = searchParams.get('kgId');

        if (drawerId) {
            const success = await deleteDrawer(drawerId);
            return NextResponse.json({ success });
        }

        if (kgId) {
            const { error } = await client
                .database
                .from('memory_knowledge_graph')
                .delete()
                .eq('id', kgId);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'drawerId or kgId required' }, { status: 400 });

    } catch (error: any) {
        console.error('Memory API DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
