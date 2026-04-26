import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';
import { randomUUID } from 'crypto';

const JITSI_APP_ID = process.env.JITSI_APP_ID || '';
const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET || '';

function generateRoomName(): string {
  const uuid = randomUUID();
  return `alea-${uuid.substring(0, 8)}`;
}

function generateJitsiToken(roomName: string, userId: string, userName: string): string {
  // JWT token for Jitsi Pro (if using) - placeholder for now
  // For free tier Jitsi Meet, no token needed
  return '';
}

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      meetingId, 
      title, 
      agendaActionId,
      scheduledAt,
      attendees = [],
      duration = 60,
      recordWithFathom = true
    } = await req.json();

    const roomName = generateRoomName();
    const startTime = scheduledAt ? new Date(scheduledAt) : new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Create meeting record
    const { data: meeting, error: meetingError } = await client
      .database
      .from('meetings')
      .insert({
        title: title || `Reunión ${new Date().toLocaleDateString()}`,
        jitsi_room_name: roomName,
        host_id: user.id,
        scheduled_at: startTime.toISOString(),
        duration_minutes: duration,
        participant_ids: attendees,
        agenda_id: agendaActionId,
        status: 'scheduled'
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error creating meeting:', meetingError);
      return NextResponse.json({ error: meetingError.message }, { status: 500 });
    }

    const jitsiUrl = `https://meet.jit.si/${roomName}`;

    const { error: updateError } = await client
      .database
      .from('meetings')
      .update({ jitsi_room_url: jitsiUrl })
      .eq('id', meeting.id);

    if (updateError) {
      console.error('Error updating meeting URL:', updateError);
    }

    return NextResponse.json({
      meeting: {
        ...meeting,
        jitsiUrl,
        roomName,
        hostUrl: `${jitsiUrl}?config.startWithAudioMuted=true&config.startWithVideoMuted=true`,
        guestUrl: jitsiUrl
      }
    });

  } catch (error: any) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    const status = searchParams.get('status') || 'scheduled';

    if (meetingId) {
      const { data, error } = await client
        .database
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const jitsiUrl = `https://meet.jit.si/${data.jitsi_room_name}`;
      return NextResponse.json({
        meeting: {
          ...data,
          jitsiUrl,
          roomName: data.jitsi_room_name,
          hostUrl: `${jitsiUrl}?config.startWithAudioMuted=true&config.startWithVideoMuted=true`,
          guestUrl: jitsiUrl
        }
      });
    }

    // Get meetings for user
    const { data, error } = await client
      .database
      .from('meetings')
      .select('*')
      .or(`host_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const meetingsWithUrls = (data || []).map((m: any) => {
      const jitsiUrl = `https://meet.jit.si/${m.jitsi_room_name}`;
      return {
        ...m,
        jitsiUrl,
        roomName: m.jitsi_room_name,
        hostUrl: `${jitsiUrl}?config.startWithAudioMuted=true&config.startWithVideoMuted=true`,
        guestUrl: jitsiUrl
      };
    });

    return NextResponse.json({ meetings: meetingsWithUrls });

  } catch (error: any) {
    console.error('Get meetings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
