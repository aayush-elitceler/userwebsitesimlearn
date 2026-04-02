import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { planKey, token } = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/users/payments/cashfree/orders`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planKey }),
    }
  );

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}
