import { NextRequest } from 'next/server';
import { CAMPAIGNS, METRICS_DATA, AD_GROUPS } from '@/lib/googleAdsData';
import { authenticate, handleCors, successResponse, errorResponse } from '../_lib/apiUtils';
import { subDays, format } from 'date-fns';

/**
 * GET /api/campaigns
 * Query: ?status=ENABLED|PAUSED|REMOVED
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status')?.toUpperCase();

  let campaigns = [...CAMPAIGNS];

  if (statusFilter && ['ENABLED', 'PAUSED', 'REMOVED'].includes(statusFilter)) {
    campaigns = campaigns.filter(c => c.status === statusFilter);
  }

  // Enrich with aggregated metrics
  const enriched = campaigns.map(c => {
    const metrics = METRICS_DATA.filter(m => m.campaignId === c.id);
    const adGroups = AD_GROUPS.filter(ag => ag.campaignId === c.id);
    const impressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const clicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const cost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const conversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

    return {
      ...c,
      adGroupCount: adGroups.length,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cost: Math.round(cost * 100) / 100,
      conversions,
    };
  });

  return successResponse(enriched);
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
    const { name, type, goal, dailyBudget, startDate, endDate, status } = body;

    if (!name || !type) {
      return errorResponse('Missing required fields: name, type');
    }

    const newCampaign = {
      id: `c_${Date.now()}`,
      name,
      status: status || 'ENABLED',
      type: type || 'SEARCH',
      dailyBudget: dailyBudget || 100,
      totalSpend: 0,
      startDate: startDate || format(new Date(), 'yyyy-MM-dd'),
      endDate: endDate || undefined,
    };

    // @ts-ignore — pushing to in-memory array
    CAMPAIGNS.push(newCampaign);

    return successResponse(newCampaign, 201);
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
