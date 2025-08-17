import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Google AI API key is not set' },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const prompt = String(form.get('prompt') || '');
    const style = String(form.get('style') || '');
    const grade = String(form.get('grade') || '');
    const videoFile = form.get('video');

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Missing prompt' },
        { status: 400 }
      );
    }

    if (!videoFile || typeof videoFile === 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing video file' },
        { status: 400 }
      );
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Convert video file to base64
    const videoBlob = videoFile as unknown as Blob;
    const arrayBuffer = await videoBlob.arrayBuffer();
    const videoBase64 = Buffer.from(arrayBuffer).toString('base64');

    // Create contextual system prompt
    const systemPrompt = createSystemPrompt(grade, style);
    
    // Get Gemini model (using vision model that can handle video)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt
    });

    // Generate content with video and prompt
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'video/webm',
          data: videoBase64,
        },
      },
      prompt,
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ 
      success: true, 
      data: { response: text } 
    });

  } catch (err: any) {
    console.error('Gemini video API error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

function createSystemPrompt(grade: string, style: string): string {
  const gradeContext = grade ? `for ${grade} level` : '';
  const styleContext = getStyleContext(style);
  
  return `You are an AI assistant analyzing screen recordings and providing real-time help.

CONTEXT:
- You are helping a student ${gradeContext}
- Communication style: ${styleContext}
- You are analyzing what's happening on their screen

CAPABILITIES:
- Analyze screen content (websites, applications, documents, code, etc.)
- Provide contextual help and suggestions
- Answer questions about what's visible
- Give step-by-step guidance
- Explain concepts related to what's shown

GUIDELINES:
- Be helpful and encouraging
- Provide specific, actionable advice
- Reference what you see on the screen
- Keep responses conversational and clear
- Focus on educational value
- Be concise but thorough

Remember: You're seeing exactly what the student sees on their screen, so provide relevant, contextual assistance based on the visual content and their question.`;
}

function getStyleContext(style: string): string {
  switch (style) {
    case 'professor':
      return 'Professional, academic, detailed explanations with proper terminology';
    case 'friend':
      return 'Casual, friendly, supportive with simple explanations';
    default:
      return 'Balanced, helpful, and encouraging';
  }
}
