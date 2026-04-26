/**
 * Hermes Memory API - Access MemPalace Memory System
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge';
import { getMemoryContext, searchMemory, formatMemoryContextForAI } from '@/lib/memory';

export async function GET(req: NextRequest) {
  try {
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const { data: authData } = await client.auth.getCurrentUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const entityEmail = searchParams.get('email');
    const entityId = searchParams.get('id');
    const query = searchParams.get('q');
    const wingName = searchParams.get('wing');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (action === 'search' && query) {
      const results = await searchMemory(query, { limit });
      return NextResponse.json({ results, count: results.length });
    }

    if (action === 'context' && (entityEmail || entityId || wingName)) {
      const wing = wingName || (entityEmail
        ? `investor_${entityEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
        : entityId ? `investor_${entityId}` : null);

      if (!wing) {
        return NextResponse.json({ error: 'Need email, id, or wing name' }, { status: 400 });
      }

      const context = await formatMemoryContextForAI(wing, { maxItems: limit });
      return NextResponse.json({ context, wing });
    }

    const { data: wings } = await client
      .database.from('memory_wings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    return NextResponse.json({
      wings: wings || [],
      count: wings?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const { data: authData } = await client.auth.getCurrentUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { wingType, entityEmail, entityId, roomName, hallType, content, importance } = await req.json();

    if (!roomName || !hallType || !content) {
      return NextResponse.json({
        error: 'roomName, hallType, and content are required'
      }, { status: 400 });
    }

    let wingName: string;

    if (entityEmail) {
      wingName = `investor_${entityEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    } else if (entityId) {
      wingName = `${wingType || 'general'}_${entityId}`;
    } else {
      wingName = `general_${Date.now()}`;
    }

    let { data: wing } = await client
      .database.from('memory_wings')
      .select('id')
      .eq('name', wingName)
      .single();

    if (!wing) {
      const { data: newWing, error: wingError } = await client
        .database.from('memory_wings')
        .insert({
          name: wingName,
          wing_type: wingType || 'general',
          keywords: [],
        })
        .select('id')
        .single();

      if (wingError) throw new Error(wingError.message);
      wing = newWing;
    }

    let { data: room } = await client
      .database.from('memory_rooms')
      .select('id')
      .eq('wing_id', wing.id)
      .eq('name', roomName)
      .single();

    if (!room) {
      const { data: newRoom, error: roomError } = await client
        .database.from('memory_rooms')
        .insert({
          wing_id: wing.id,
          name: roomName,
          hall_type: hallType,
        })
        .select('id')
        .single();

      if (roomError) throw new Error(roomError.message);
      room = newRoom;
    }

    const { data: drawer, error: drawerError } = await client
      .database.from('memory_drawers')
      .insert({
        room_id: room.id,
        content,
        content_type: 'text',
        importance_score: importance || 50,
        source: 'hermes_api',
        source_id: authData.user.id,
      })
      .select('id')
      .single();

    if (drawerError) throw new Error(drawerError.message);

    return NextResponse.json({
      success: true,
      memory_id: drawer.id,
      wing: wingName,
      room: roomName,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let token = req.cookies.get('insforge_token')?.value;
    const authHeader = req.headers.get('authorization');

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createAuthenticatedClient(token);
    const { data: authData } = await client.auth.getCurrentUser();

    if (!authData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get('id');

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }

    const { error } = await client
      .database.from('memory_drawers')
      .delete()
      .eq('id', memoryId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
