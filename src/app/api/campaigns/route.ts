import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, handleCors, successResponse, errorResponse } from '../_lib/apiUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/campaigns
 * Query: ?status=ENABLED|PAUSED|REMOVED&platform=Google Ads|Facebook Ads
 * Returns campaigns from Supabase
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status')?.toUpperCase();
  const platformFilter = searchParams.get('platform');

  let query = supabase.from('campaigns').select('*');

  if (statusFilter && ['ENABLED', 'PAUSED', 'REMOVED'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  if (platformFilter) {
    query = query.eq('platform', platformFilter);
  }

  const { data, error } = await query.order('platform').order('campaign_name');

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  // Map DB column names to API response shape
  const campaigns = (data || []).map(row => ({
    id: row.id,
    name: row.campaign_name,
    status: row.status,
    type: row.type,
    platform: row.platform,
    dailyBudget: Number(row.daily_budget),
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: Number(row.ctr),
    avgCpc: Number(row.avg_cpc),
    cost: Number(row.cost),
    conversions: row.conversions,
    roas: Number(row.roas),
    createdAt: row.created_at,
  }));

  return NextResponse.json(
    { success: true, data: campaigns },
    { 
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    }
  );
}

/**
 * POST /api/campaigns
 * Body: { name, type, goal, dailyBudget, startDate, endDate, status }
 */
export async function POST(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, type, status, dailyBudget, platform } = body;

    if (!name || !type) {
      return errorResponse('Missing required fields: name, type');
    }

    const newId = `c_${Date.now()}`;
    const row = {
      id: newId,
      campaign_name: name,
      status: status || 'ENABLED',
      type: type || 'SEARCH',
      platform: platform || 'Google Ads',
      daily_budget: dailyBudget || 100,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      avg_cpc: 0,
      cost: 0,
      conversions: 0,
      roas: 0,
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(row)
      .select()
      .single();

    if (error) {
      return errorResponse(`Database error: ${error.message}`, 500);
    }

    return successResponse({
      id: data.id,
      name: data.campaign_name,
      status: data.status,
      type: data.type,
      platform: data.platform,
      dailyBudget: Number(data.daily_budget),
      impressions: data.impressions,
      clicks: data.clicks,
      ctr: Number(data.ctr),
      avgCpc: Number(data.avg_cpc),
      cost: Number(data.cost),
      conversions: data.conversions,
      roas: Number(data.roas),
    }, 201);
  } catch {
    return errorResponse('Invalid request body');
  }
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
