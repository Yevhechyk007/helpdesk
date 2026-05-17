import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuth = pathname.startsWith('/login');
  const isDashboard = pathname.startsWith('/dashboard');

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAuth && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};
