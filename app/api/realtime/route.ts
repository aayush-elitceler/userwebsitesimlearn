import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sdp } = await request.json();

    if (!sdp) {
      return NextResponse.json(
        { error: "Missing sdp in body" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Forward SDP to OpenAI Realtime endpoint
    const openaiRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/sdp"
        },
        body: sdp
      }
    );

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI realtime error:", openaiRes.status, errText);
      return NextResponse.json(
        { error: "OpenAI API error", details: errText },
        { status: openaiRes.status }
      );
    }

    const answerSdp = await openaiRes.text();

    // Return SDP answer as plain text
    return new NextResponse(answerSdp, {
      headers: {
        'Content-Type': 'application/sdp'
      }
    });

  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
