import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("🚀 Starting real-time session");
    const { model = 'gpt-4o-realtime-preview-2024-12-17', voice, grade, style } = await request
      .json()
      .catch(() => ({}));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    // Map style -> voice on the server for safety
    // Note: Realtime does not support the "echo" voice; use a distinct supported
    // Realtime voice (e.g., "verse") for differentiation. "alloy" remains for friend.
    const mappedVoice = (typeof style === 'string' && style.toLowerCase() === 'professor')
      ? 'verse'
      : (typeof style === 'string' && style.toLowerCase() === 'friend')
        ? 'alloy'
        : (voice || 'alloy');

    // Build instruction so the model adapts to grade and persona
    const gradeText = typeof grade === 'string' ? grade : 'student';
    const persona = typeof style === 'string' ? style : 'friend';
    const instructions = `You are speaking to a ${gradeText} learner. Respond in spoken form only, with ${persona === 'professor' ? 'clear, structured, authoritative' : 'friendly, encouraging, and simple'} explanations appropriate for that grade. Keep responses concise and conversational.`;

    // Some Realtime deployments expect a "voice" and may accept "instructions"; we pass both here.

    const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({ model, voice: mappedVoice, instructions }),
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
    console.error('Error creating realtime session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}


