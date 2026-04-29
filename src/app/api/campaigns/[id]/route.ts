import { NextRequest } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_METRICS, MOCK_AD_GROUPS, MOCK_KEYWORDS, MOCK_ADS } from '@/lib/mockGoogleAds';
import { authenticate, handleCors, successResponse, errorResponse } from '../../_lib/apiUtils';

/**
 * GET /api/campaigns/[id]
 * Returns single campaign with its ad groups, keywords, and ads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const campaign = MOCK_CAMPAIGNS.find(c => c.id === params.id);
  if (!campaign) {
    return errorResponse('Campaign not found', 404);
  }

  const metrics = MOCK_METRICS.filter(m => m.campaignId === params.id);
  const adGroups = MOCK_AD_GROUPS.filter(ag => ag.campaignId === params.id);
  const adGroupIds = adGroups.map(ag => ag.id);
  const keywords = MOCK_KEYWORDS.filter(kw => adGroupIds.includes(kw.adGroupId));
  const ads = MOCK_ADS.filter(ad => adGroupIds.includes(ad.adGroupId));

  // Aggregated stats
  const impressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const clicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const cost = metrics.reduce((sum, m) => sum + m.cost, 0);
  const conversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

  return successResponse({
    ...campaign,
    stats: {
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cost: Math.round(cost * 100) / 100,
      conversions,
    },
    adGroups,
    keywords,
    ads,
    metricsTimeline: metrics.sort((a, b) => a.date.localeCompare(b.date)),
  });
}

/**
 * PATCH /api/campaigns/[id]
 * Body: { status?, dailyBudget?, name?, ... }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const idx = MOCK_CAMPAIGNS.findIndex(c => c.id === params.id);
  if (idx === -1) {
    return errorResponse('Campaign not found', 404);
  }

  try {
    const body = await request.json();
    const allowedFields = ['name', 'status', 'type', 'dailyBudget', 'startDate', 'endDate'];

    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        (MOCK_CAMPAIGNS[idx] as any)[key] = body[key];
      }
    }

    return successResponse(MOCK_CAMPAIGNS[idx]);
  } catch {
    return errorResponse('Invalid request body');
  }
}

/**
 * DELETE /api/campaigns/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const idx = MOCK_CAMPAIGNS.findIndex(c => c.id === params.id);
  if (idx === -1) {
    return errorResponse('Campaign not found', 404);
  }

  MOCK_CAMPAIGNS.splice(idx, 1);

  return successResponse({ deletedId: params.id });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
