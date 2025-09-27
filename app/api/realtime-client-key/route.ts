import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const prompts = {
  name: 'You are a helpful assistant.',
};

export async function POST(request: Request) {
  try {
    const { grade, persona } = await request.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.realtime.clientSecrets.create({
      session: {
        type: 'realtime',
        model: 'gpt-realtime',
        audio: {
          output: {
            voice: 'cedar',
          },
        },
        instructions: `${prompts.name} Grade: ${grade || 'N/A'}, Persona: ${persona || 'friend'}`,
      },
    });

    return NextResponse.json({ token: response.value });
  } catch (error) {
    console.error('Error generating client token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
