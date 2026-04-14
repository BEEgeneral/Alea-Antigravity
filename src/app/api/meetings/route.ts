import { createAuthenticatedClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("id");
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming") === "true";

  let query = client.database.from("meetings").select("*");

  if (meetingId) {
    query = query.eq("id", meetingId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (upcoming) {
    query = query.gte("scheduled_at", new Date().toISOString());
    query = query.in("status", ["scheduled", "in_progress"]);
  }

  query = query.order("scheduled_at", { ascending: true });

  const { data: meetings, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ meetings: meetings || [] });
}

export async function POST(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, scheduled_at, duration_minutes, jitsi_room_name, jitsi_room_url, participant_ids, agenda_id } = body;

    if (!title || !scheduled_at) {
      return NextResponse.json({ error: "title and scheduled_at are required" }, { status: 400 });
    }

    const meetingData: any = {
      title,
      description,
      scheduled_at,
      duration_minutes: duration_minutes || 30,
      jitsi_room_name,
      jitsi_room_url,
      host_id: user.id,
      participant_ids: participant_ids || [],
      agenda_id,
      status: "scheduled"
    };

    const { data: meeting, error } = await client
      .database
      .from("meetings")
      .insert(meetingData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ meeting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, title, description, scheduled_at, duration_minutes, jitsi_room_name, jitsi_room_url, participant_ids, agenda_id, status, meeting_notes, fathom_recording_id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (jitsi_room_name !== undefined) updateData.jitsi_room_name = jitsi_room_name;
    if (jitsi_room_url !== undefined) updateData.jitsi_room_url = jitsi_room_url;
    if (participant_ids !== undefined) updateData.participant_ids = participant_ids;
    if (agenda_id !== undefined) updateData.agenda_id = agenda_id;
    if (status !== undefined) updateData.status = status;
    if (meeting_notes !== undefined) updateData.meeting_notes = meeting_notes;
    if (fathom_recording_id !== undefined) updateData.fathom_recording_id = fathom_recording_id;

    const { data: meeting, error } = await client
      .database
      .from("meetings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    return NextResponse.json({ meeting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const client = await createAuthenticatedClient();
  const { data: { user } } = await client.auth.getCurrentUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("id");

  if (!meetingId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await client
    .database
    .from("meetings")
    .delete()
    .eq("id", meetingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}