import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('apiKey', apiKey);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'OPENAI_API_KEY not set' }),
        { status: 500 }
      );
    }

    const { text, voice = 'alloy', format = 'mp3' } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing text' }),
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const speech = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      // @ts-ignore
      format,
    });

    const arrayBuffer = await speech.arrayBuffer();
    const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';
    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('tts error', err);
    return new Response(
      JSON.stringify({ success: false, message: err?.message || 'TTS error' }),
      { status: 500 }
    );
  }
}
