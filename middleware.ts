// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Decode payload (NOT secure, just for reading claims)
  try {
    // Optionally check exp, roles, etc.
    return NextResponse.next();
  } catch (e) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/dashboard'],
};
