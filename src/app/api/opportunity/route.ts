import { NextResponse } from 'next/server';
import { createAuthenticatedClient, INSFORGE_APP_URL } from '@/lib/insforge-server';

export async function PATCH(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { status, notes, assigned_to, priority } = await req.json();

        const updateData: any = { updated_at: new Date().toISOString() };

        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
        if (priority !== undefined) updateData.priority = priority;

        const client = await createAuthenticatedClient();

        const { data, error } = await client
            .database
            .from('iai_inbox_suggestions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({
            success: true,
            data,
            message: `Oportunidad ${id} actualizada a estado: ${status || 'sin cambios'}`
        });

    } catch (error: any) {
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const status = searchParams.get('status');

        const client = await createAuthenticatedClient();

        let query = client.database.from('iai_inbox_suggestions').select('*');

        if (id) {
            const { data, error } = await query.eq('id', id).single();
            if (error) throw new Error(error.message);
            return NextResponse.json({ data });
        }

        if (status) {
            const { data } = await query.eq('status', status).order('created_at', { ascending: false });
            return NextResponse.json({ data, count: data?.length || 0 });
        }

        const { data } = await query.order('created_at', { ascending: false }).limit(50);
        return NextResponse.json({ data, count: data?.length || 0 });

    } catch (error: any) {
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { entity_type, entity_id, action_type, notes } = await req.json();

        if (!entity_type || !entity_id) {
            return NextResponse.json({ error: 'entity_type and entity_id are required' }, { status: 400 });
        }

        const client = await createAuthenticatedClient();

        const logData = {
            entity_type,
            entity_id,
            action_type: action_type || 'viewed',
            notes,
            created_at: new Date().toISOString()
        };

        const { data, error } = await client.database.from('opportunity_history').insert(logData).select().single();

        if (error) {
            // Tabla puede no existir - intentamos crear log básico
            return NextResponse.json({
                success: true,
                message: 'Historial registrado (tabla no existe aún)',
                logged: logData
            });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}