import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get profiles from centurion_profiles
    const { data: profiles, error: profilesError } = await client
      .database
      .from('centurion_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (profilesError) {
      console.error('Profiles error:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Get classifications
    const { data: classifications, error: classError } = await client
      .database
      .from('investor_classifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (classError) {
      console.error('Classifications error:', classError);
    }

    // Get investors with classification data
    const { data: investors, error: investorsError } = await client
      .database
      .from('investors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (investorsError) {
      console.error('Investors error:', investorsError);
    }

    return NextResponse.json({
      profiles: profiles || [],
      classifications: classifications || [],
      investors: investors || []
    });

  } catch (error: any) {
    console.error('Dossiers GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}