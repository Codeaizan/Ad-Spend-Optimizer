import { NextRequest, NextResponse } from 'next/server';

/**
 * Shared API utilities for authentication, CORS, and response formatting.
 */

// CORS headers for external access (e.g., N8N workflows)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
};

/**
 * Returns a preflight OPTIONS response with CORS headers.
 */
export function handleCors() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders });
}

/**
 * Validates the x-api-key header against DASHBOARD_API_KEY env variable.
 * Returns null if valid, or a 401 NextResponse if invalid.
 */
export function authenticate(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.DASHBOARD_API_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { success: false, error: 'Server misconfiguration: API key not set' },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  return null; // Auth passed
}

/**
 * Returns a success JSON response with CORS headers.
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status, headers: corsHeaders }
  );
}

/**
 * Returns an error JSON response with CORS headers.
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: corsHeaders }
  );
}
