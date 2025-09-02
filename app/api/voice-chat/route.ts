// Location: app/api/voice-chat/route.ts

import { NextResponse } from 'next/server';

// Create an ephemeral Realtime session via REST.
// Docs: https://platform.openai.com/docs/guides/realtime/overview
export async function POST(request: Request) {
  try {
    const { model = 'gpt-4o-realtime-preview-2024-12-17', voice = 'alloy' } = await request
      .json()
      .catch(() => ({}));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({ model, voice }),
    });

    if (!res.ok) {
      const details = await res.text();
      return NextResponse.json(
        { error: 'Failed to create session', details },
        { status: res.status }
      );
    }

    const session = await res.json();
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating real-time session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
