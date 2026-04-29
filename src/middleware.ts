import { NextRequest, NextResponse } from 'next/server';

/**
 * Global CORS middleware for all /api/* routes.
 * Ensures external tools (n8n, Postman, etc.) can call the API.
 */
export function middleware(request: NextRequest) {
  // Handle CORS preflight (OPTIONS) immediately
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  }

  // For all other requests, clone the response and add CORS headers
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  return response;
}

// Only run this middleware on /api/* routes
export const config = {
  matcher: '/api/:path*',
};
