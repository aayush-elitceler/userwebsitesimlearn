import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'OPENAI_API_KEY is not set' },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const prompt = String(form.get('prompt') || '');
    const style = String(form.get('style') || '');
    const grade = String(form.get('class') || '');
    const file = form.get('image');

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Missing prompt' },
        { status: 400 }
      );
    }

    let imageDataUrl: string | undefined;
    if (file && typeof file !== 'string') {
      const blob = file as unknown as Blob;
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mime = (blob as any).type || 'image/png';
      imageDataUrl = `data:${mime};base64,${base64}`;
    }

    const system = `You are a helpful teaching assistant.
Consider the user's grade: ${grade || 'unspecified'} and persona/style: ${
      style || 'unspecified'
    }.
If an image is provided, analyze it carefully and answer the question about what is shown. Keep answers concise, student-friendly, and speak aloud text will be generated.`;

    const client = new OpenAI({ apiKey });

    const userContent: any = [{ type: 'text', text: prompt }];
    if (imageDataUrl) {
      userContent.push({ type: 'image_url', image_url: { url: imageDataUrl } });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent as any },
      ],
      temperature: 0.6,
    });

    const text = completion.choices?.[0]?.message?.content || 'No response';

    return NextResponse.json({ success: true, data: { response: text } });
  } catch (err: any) {
    console.error('vision-chat error', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
