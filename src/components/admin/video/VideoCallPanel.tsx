'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, VideoOff, Calendar, Clock, Users, Plus,
  X, ExternalLink, Mic, MicOff, Copy, Trash2,
  Play, Square, MessageSquare, FileText, CheckCircle,
  AlertCircle, Loader2, Settings, ChevronRight
} from 'lucide-react';
import JitsiRoom from './JitsiRoom';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  jitsi_room_name?: string;
  jitsi_room_url?: string;
  host_id: string;
  scheduled_at: string;
  duration_minutes: number;
  participant_ids: string[];
  agenda_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meeting_notes?: string;
  fathom_recording_id?: string;
  created_at: string;
}

interface AgendaAction {
  id: string;
  title: string;
  action_type: string;
  due_date: string;
  priority: string;
  status: string;
  lead?: {
    name?: string;
    investors?: { full_name: string };
  };
}

interface VideoCallPanelProps {
  leadId?: string;
  isEmbedded?: boolean;
}

export default function VideoCallPanel({ leadId, isEmbedded }: VideoCallPanelProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [agendaActions, setAgendaActions] = useState<AgendaAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    duration: 30,
    scheduledAt: '',
    linkedActionId: '',
    attendees: [] as string[],
    recordWithFathom: true
  });

  useEffect(() => {
    fetchMeetings();
    fetchAgendaActions();
  }, [leadId]);

  async function fetchMeetings() {
    setLoading(true);
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAgendaActions() {
    try {
      const res = await fetch('/api/agenda/actions?status=pending&limit=50');
      const data = await res.json();
      setAgendaActions(data || []);
    } catch (error) {
      console.error('Error fetching agenda actions:', error);
    }
  }

  async function createMeeting() {
    if (!newMeeting.title || !newMeeting.scheduledAt) return;

    try {
      const res = await fetch('/api/video/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMeeting.title,
          scheduledAt: newMeeting.scheduledAt,
          duration: newMeeting.duration,
          agendaActionId: newMeeting.linkedActionId || null,
          attendees: newMeeting.attendees,
          recordWithFathom: newMeeting.recordWithFathom
        })
      });

      const data = await res.json();
      
      if (data.meeting) {
        setMeetings(prev => [data.meeting, ...prev]);
        setIsCreating(false);
        setActiveMeeting(data.meeting);
        setNewMeeting({
          title: '',
          duration: 30,
          scheduledAt: '',
          linkedActionId: '',
          attendees: [],
          recordWithFathom: true
        });
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  }

  async function joinMeeting(meeting: Meeting) {
    setActiveMeeting(meeting);
    
    // If meeting is scheduled and not started, update status
    if (meeting.status === 'scheduled') {
      await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: meeting.id, status: 'in_progress' })
      });
    }
  }

  async function endMeeting() {
    if (!activeMeeting) return;

    try {
      await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meetingId: activeMeeting.id, 
          status: 'completed',
          endAt: new Date().toISOString()
        })
      });

      setActiveMeeting(null);
      fetchMeetings();
    } catch (error) {
      console.error('Error ending meeting:', error);
    }
  }

  async function deleteMeeting(meetingId: string) {
    if (!confirm('¿Eliminar esta reunión?')) return;

    try {
      await fetch(`/api/meetings?meetingId=${meetingId}`, { method: 'DELETE' });
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
  }

  const filteredMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_at);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return meetingDate >= now || m.status === 'scheduled' || m.status === 'in_progress';
    }
    if (filter === 'past') {
      return meetingDate < now && m.status !== 'scheduled';
    }
    return true;
  });

  const upcomingCount = meetings.filter(m => 
    new Date(m.scheduled_at) >= new Date() || m.status === 'in_progress'
  ).length;

  if (activeMeeting) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl">{activeMeeting.title}</h2>
            <p className="text-sm text-muted-foreground">
              {activeMeeting.status === 'in_progress' ? 'En progreso' : 'Sala activa'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={endMeeting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
            >
              <Square size={16} />
              Finalizar
            </button>
          </div>
        </div>

        {/* Jitsi Room */}
        <div className="flex-1">
          <JitsiRoom
            roomName={activeMeeting.jitsi_room_name || 'default-room'}
            jitsiUrl={`https://meet.jit.si/${activeMeeting.jitsi_room_name || 'default-room'}`}
            isHost={true}
            onLeave={endMeeting}
            userName="Alea Agent"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? '' : 'max-w-6xl mx-auto w-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl flex items-center gap-3">
            <Video size={24} className="text-primary" />
            Videollamadas
          </h2>
          <p className="text-sm text-muted-foreground">
            Jitsi Meet + Fathom.ai Recording
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Nueva Llamada
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Video size={14} className="text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Próximas</span>
          </div>
          <p className="text-2xl font-bold">{upcomingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Completadas</span>
          </div>
          <p className="text-2xl font-bold">
            {meetings.filter(m => m.status === 'completed').length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Grabadas</span>
          </div>
          <p className="text-2xl font-bold">
            {meetings.filter(m => m.fathom_recording_id).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(['upcoming', 'past', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              filter === f 
                ? 'bg-primary/10 text-primary border border-primary/30' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {f === 'upcoming' ? 'Próximas' : f === 'past' ? 'Pasadas' : 'Todas'}
          </button>
        ))}
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Video size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No hay reuniones {filter === 'upcoming' ? 'programadas' : filter === 'past' ? 'pasadas' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map(meeting => (
            <div 
              key={meeting.id}
              className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{meeting.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      meeting.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      meeting.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500' :
                      meeting.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {meeting.status === 'scheduled' ? 'Programada' :
                       meeting.status === 'in_progress' ? 'En curso' :
                       meeting.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </span>
                    {meeting.status === 'in_progress' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        En vivo
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(meeting.scheduled_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video size={12} />
                      {meeting.duration_minutes} min
                    </span>
                    {meeting.participant_ids?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {meeting.participant_ids.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {meeting.status !== 'completed' && (
                    <button
                      onClick={() => joinMeeting(meeting)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-2"
                    >
                      <Play size={14} />
                      {meeting.status === 'in_progress' ? 'Reunirse' : 'Iniciar'}
                    </button>
                  )}
                  
                  {meeting.fathom_recording_id && (
                    <a
                      href={`https://app.usefathom.com/recordings/${meeting.fathom_recording_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-muted rounded-lg text-xs flex items-center gap-1 hover:bg-muted/80"
                    >
                      <ExternalLink size={12} />
                      Ver Grabación
                    </a>
                  )}

                  <button
                    onClick={() => copyLink(`https://meet.jit.si/${meeting.jitsi_room_name}`)}
                    className="p-2 hover:bg-muted rounded-lg"
                    title="Copiar enlace"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    onClick={() => deleteMeeting(meeting.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Recording & Summary */}
              {meeting.fathom_recording_id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <FileText size={12} />
                    <span>Resumen</span>
                  </div>
                  <p className="text-sm">{meeting.meeting_notes || 'Sin resumen disponible'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Meeting Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-card border border-border rounded-[2rem] p-8 max-w-lg w-full"
            >
              <button
                onClick={() => setIsCreating(false)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg"
              >
                <X size={18} />
              </button>

              <h2 className="font-serif text-2xl mb-2">Nueva Videollamada</h2>
              <p className="text-sm text-muted-foreground mb-6">Crear sala de Jitsi Meet</p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Título</label>
                  <input
                    type="text"
                    value={newMeeting.title}
                    onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="Ej: Llamada con Juan García"
                    className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      value={newMeeting.scheduledAt}
                      onChange={e => setNewMeeting({ ...newMeeting, scheduledAt: e.target.value })}
                      className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Duración</label>
                    <select
                      value={newMeeting.duration}
                      onChange={e => setNewMeeting({ ...newMeeting, duration: Number(e.target.value) })}
                      className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none appearance-none"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1.5 horas</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">Vincular a Acción</label>
                  <select
                    value={newMeeting.linkedActionId}
                    onChange={e => setNewMeeting({ ...newMeeting, linkedActionId: e.target.value })}
                    className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none appearance-none"
                  >
                    <option value="">Sin vincular</option>
                    {agendaActions.map(action => (
                      <option key={action.id} value={action.id}>
                        {action.title} - {new Date(action.due_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="fathomRecord"
                    checked={newMeeting.recordWithFathom}
                    onChange={e => setNewMeeting({ ...newMeeting, recordWithFathom: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="fathomRecord" className="text-sm flex items-center gap-2">
                    <span>Grabar con Fathom.ai</span>
                    <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full">emailai@alea.es</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
                  <Video size={14} />
                  <span>La sala se creará en Jitsi Meet (máx. 25 participantes)</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createMeeting}
                    disabled={!newMeeting.title || !newMeeting.scheduledAt}
                    className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold disabled:opacity-50"
                  >
                    Crear Sala
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
