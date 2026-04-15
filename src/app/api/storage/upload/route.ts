import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://if8rkq6j.insforge.app';

export async function POST(req: NextRequest) {
    try {
        const client = await createAuthenticatedClient();
        const { data: { user }, error: authError } = await client.auth.getCurrentUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const bucket = formData.get('bucket') as string;
        const fileName = formData.get('fileName') as string;

        if (!file || !bucket || !fileName) {
            return NextResponse.json({ error: 'Missing file, bucket or fileName' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });

        const { data, error } = await client.storage
            .from(bucket)
            .upload(fileName, blob);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const url = `${INSFORGE_URL}/api/storage/buckets/${bucket}/objects/${fileName}`;

        return NextResponse.json({ success: true, url, path: data?.key });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}