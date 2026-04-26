/**
 * Hermes Speech API - Text-to-Speech y Speech-to-Text
 * Powered by MiniMax Speech 2.8
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = 'https://api.minimax.io';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { action } = body;

      if (action === 'tts') {
        return await handleTTS(body);
      }
    }

    if (contentType.includes('multipart/form-data')) {
      return await handleSTT(req);
    }

    return NextResponse.json({ error: 'Invalid content-type. Use JSON for TTS or FormData for STT' }, { status: 400 });

  } catch (error: any) {
    console.error('Speech API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleTTS(body: { text?: string; voice?: string; speed?: number; model?: string }) {
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'MINIMAX_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { text, voice = 'male-qn-qingse', speed = 1.0, model = 'speech-02' } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await fetch(`${MINIMAX_BASE_URL}/v1/t2a_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        text: text.substring(0, 1000),
        voice_setting: {
          voice_id: voice,
          speed,
          pitch: 0,
          volume: 0,
        },
        audio_setting: {
          audio_type: 'mp3',
          sample_rate: 32000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax TTS error: ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSTT(req: NextRequest) {
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'MINIMAX_API_KEY not configured' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    const response = await fetch(`${MINIMAX_BASE_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: buffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax STT error: ${error}`);
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.text || '',
      language: result.language || 'es',
    });

  } catch (error: any) {
    console.error('STT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Hermes Speech API',
    version: '1.0',
    capabilities: {
      tts: {
        models: ['speech-02', 'speech-02-hd', 'speech-02-turbo'],
        voices: [
          { id: 'male-qn-qingse', name: 'Qingse (Masculino)' },
          { id: 'female-tianmei', name: 'Tianmei (Femenino)' },
          { id: 'female-yunyang', name: 'Yunyang (Femenino)' },
          { id: 'male-yunfeng', name: 'Yunfeng (Masculino)' },
        ],
        languages: ['es', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'pt', 'it', 'ru'],
      },
      stt: {
        models: ['speech-02', 'speech-02-hd'],
        languages: ['es', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'pt', 'it', 'ru'],
      },
    },
  });
}
