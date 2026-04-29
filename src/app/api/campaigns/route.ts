import { NextRequest } from 'next/server';
import { CAMPAIGNS, METRICS_DATA, AD_GROUPS, Campaign } from '@/lib/googleAdsData';
import { FACEBOOK_CAMPAIGNS, FACEBOOK_METRICS } from '@/lib/facebookAdsData';
import { authenticate, handleCors, successResponse, errorResponse } from '../_lib/apiUtils';
import { subDays, format } from 'date-fns';

/**
 * GET /api/campaigns
 * Query: ?status=ENABLED|PAUSED|REMOVED&platform=Google Ads|Facebook Ads
 * Returns BOTH Google and Facebook campaigns combined
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status')?.toUpperCase();
  const platformFilter = searchParams.get('platform');

  // ─── Google Ads campaigns (enriched with metrics) ───────────────
  const googleEnriched = CAMPAIGNS.map(c => {
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

  // ─── Facebook Ads campaigns (enriched with metrics) ─────────────
  const facebookEnriched = FACEBOOK_CAMPAIGNS.map(c => {
    const metrics = FACEBOOK_METRICS.filter(m => m.campaignId === c.id);
    const impressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const clicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const cost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const conversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      type: c.objective,     // Map objective → type for unified shape
      platform: c.platform,  // 'Facebook Ads'
      dailyBudget: c.dailyBudget,
      totalSpend: c.totalSpend,
      startDate: c.startDate,
      endDate: c.endDate,
      adGroupCount: 0,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cost: Math.round(cost * 100) / 100,
      conversions,
    };
  });

  // ─── Combine, filter, return ────────────────────────────────────
  let all = [...googleEnriched, ...facebookEnriched];

  if (statusFilter && ['ENABLED', 'PAUSED', 'REMOVED'].includes(statusFilter)) {
    all = all.filter(c => c.status === statusFilter);
  }

  if (platformFilter) {
    all = all.filter(c => c.platform === platformFilter);
  }

  return successResponse(all);
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

    const newCampaign: Campaign = {
      id: `c_${Date.now()}`,
      name,
      status: status || 'ENABLED',
      type: type || 'SEARCH',
      platform: 'Google Ads',
      dailyBudget: dailyBudget || 100,
      totalSpend: 0,
      startDate: startDate || format(new Date(), 'yyyy-MM-dd'),
      endDate: endDate || undefined,
    };

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
