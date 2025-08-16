import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'GEMINI_API_KEY is not set' },
        { status: 500 }
      );
    }

    const { prompt, videoData, grade, style } = await req.json();

    if (!prompt && !videoData) {
      return NextResponse.json(
        { success: false, message: 'Missing video or prompt data' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Build multimodal content for video analysis
    const parts = [];
    
    if (prompt) {
      parts.push({ text: `You are a helpful teaching assistant for ${grade || 'student'} level. Respond in ${style || 'friendly'} style. ${prompt}` });
    }
    
    if (videoData) {
      // For video blob data from screen/camera stream
      parts.push({
        inlineData: {
          mimeType: "video/mp4",
          data: videoData.split(',')[1] // Remove data:video/mp4;base64, prefix
        }
      });
    }

    // Use streaming for real-time responses like Google AI Studio
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        response: fullResponse,
        timestamp: Date.now()
      } 
    });

  } catch (err: any) {
    console.error('Gemini video analysis error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Gemini error' },
      { status: 500 }
    );
  }
}
