'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Phone, Monitor,
  MoreVertical, MessageSquare, Users, Settings,
  Maximize, Minimize, Share2, Clock, Recording
} from 'lucide-react';

interface JitsiRoomProps {
  roomName: string;
  jitsiUrl: string;
  isHost?: boolean;
  onLeave?: () => void;
  onRecordingComplete?: (recordingUrl: string) => void;
  userName?: string;
  userAvatar?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiRoom({
  roomName,
  jitsiUrl,
  isHost = false,
  onLeave,
  onRecordingComplete,
  userName = 'Alea User',
  userAvatar
}: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  useEffect(() => {
    // Load Jitsi Script
    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    };

    loadJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  function initJitsi() {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

    const domain = 'meet.jit.si';
    
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName: userName,
        avatarURL: userAvatar
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        enableRecording: true,
        enableClosePage: false,
        disable1_5_joinReason: true,
        prejoinPageEnabled: true,
        gatheringTimeout: 10000,
        disableInviteFunctions: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_IN_LOGO: false,
        SHOW_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Participante Alea',
        DEFAULT_LOCAL_DISPLAY_NAME: userName,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'hangup', 'profile', 'chat', 'settings',
          'videoquality', 'tileview', 'select-background', 'hangup'
        ],
        MOBILE_APP_PROMO: false,
        TILE_VIEW_MAX_COLUMNS: 4,
        DISABLE_FOCUS_INDICATOR: false,
        DISABLE_JOIN_INDICATOR: false,
        ENABLE_DIALOUT: false,
        ENABLE_AV_MODERATION: false,
      },
      // Fathom.ai script injection for recording
      onLoadScriptUrl: 'https://cdn.fathom.ai/script.js'
    };

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // Event listeners
      apiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('Video conference joined');
      });

      apiRef.current.addEventListener('participantJoined', () => {
        setParticipantCount(prev => prev + 1);
      });

      apiRef.current.addEventListener('participantLeft', () => {
        setParticipantCount(prev => Math.max(1, prev - 1));
      });

      apiRef.current.addEventListener('recordingStatusChanged', (event: any) => {
        setIsRecording(event.recording);
      });

    } catch (error) {
      console.error('Error initializing Jitsi:', error);
    }
  }

  function toggleVideo() {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
      setIsVideoOn(prev => !prev);
    }
  }

  function toggleAudio() {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
      setIsAudioOn(prev => !prev);
    }
  }

  function shareScreen() {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleShareScreen');
    }
  }

  function toggleFullscreen() {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleFullscreen');
      setIsFullscreen(prev => !prev);
    }
  }

  function leaveMeeting() {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
      apiRef.current.dispose();
    }
    onLeave?.();
  }

  function shareLink() {
    navigator.clipboard.writeText(jitsiUrl);
    // Could show toast notification
  }

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
      {/* Jitsi Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="flex items-center justify-center space-x-4">
          {/* Audio */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioOn ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoOn ? <Video size={20} /> : <VideoOff size={20} className="text-red-500" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={shareScreen}
            className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          >
            <Monitor size={20} />
          </button>

          {/* Participants */}
          <button className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center gap-2">
            <Users size={20} />
            <span className="text-sm font-medium">{participantCount}</span>
          </button>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="px-4 py-2 rounded-full bg-red-500 flex items-center gap-2">
              <Recording size={16} />
              <span className="text-sm font-medium">Grabando</span>
            </div>
          )}

          {/* Leave */}
          <button
            onClick={leaveMeeting}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all"
          >
            <Phone size={20} className="rotate-[135deg]" />
          </button>
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
              <Clock size={14} className="inline mr-2" />
              <span className="text-sm">{roomName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={shareLink}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all"
              title="Copiar enlace"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button
              onClick={() => setShowControls(prev => !prev)}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Fathom Attribution (required by Fathom) */}
      <div className="absolute bottom-4 left-4 text-[10px] text-white/40">
        Recording powered by Fathom
      </div>
    </div>
  );
}
