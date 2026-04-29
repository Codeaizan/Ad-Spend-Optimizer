import { NextRequest } from 'next/server';
import { CAMPAIGNS, METRICS_DATA, AD_GROUPS, KEYWORDS, ADS } from '@/lib/googleAdsData';
import { FACEBOOK_CAMPAIGNS, FACEBOOK_METRICS } from '@/lib/facebookAdsData';
import { authenticate, handleCors, successResponse, errorResponse } from '../../_lib/apiUtils';

/**
 * Helper: find a campaign by id across both platforms
 */
function findCampaignAcrossPlatforms(id: string) {
  const googleIdx = CAMPAIGNS.findIndex(c => c.id === id);
  if (googleIdx !== -1) {
    return { source: 'google' as const, index: googleIdx, campaign: CAMPAIGNS[googleIdx] };
  }
  const fbIdx = FACEBOOK_CAMPAIGNS.findIndex(c => c.id === id);
  if (fbIdx !== -1) {
    return { source: 'facebook' as const, index: fbIdx, campaign: FACEBOOK_CAMPAIGNS[fbIdx] };
  }
  return null;
}

/**
 * GET /api/campaigns/[id]
 * Returns single campaign with its ad groups, keywords, and ads
 * Searches both Google and Facebook campaigns
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const found = findCampaignAcrossPlatforms(params.id);
  if (!found) {
    return errorResponse('Campaign not found', 404);
  }

  if (found.source === 'google') {
    const campaign = found.campaign;
    const metrics = METRICS_DATA.filter(m => m.campaignId === params.id);
    const adGroups = AD_GROUPS.filter(ag => ag.campaignId === params.id);
    const adGroupIds = adGroups.map(ag => ag.id);
    const keywords = KEYWORDS.filter(kw => adGroupIds.includes(kw.adGroupId));
    const ads = ADS.filter(ad => adGroupIds.includes(ad.adGroupId));

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

  // Facebook campaign
  const fbCampaign = found.campaign;
  const fbMetrics = FACEBOOK_METRICS.filter(m => m.campaignId === params.id);
  const impressions = fbMetrics.reduce((sum, m) => sum + m.impressions, 0);
  const clicks = fbMetrics.reduce((sum, m) => sum + m.clicks, 0);
  const cost = fbMetrics.reduce((sum, m) => sum + m.cost, 0);
  const conversions = fbMetrics.reduce((sum, m) => sum + m.conversions, 0);

  return successResponse({
    id: fbCampaign.id,
    name: fbCampaign.name,
    status: fbCampaign.status,
    type: fbCampaign.objective,
    platform: fbCampaign.platform,
    dailyBudget: fbCampaign.dailyBudget,
    totalSpend: fbCampaign.totalSpend,
    startDate: fbCampaign.startDate,
    endDate: fbCampaign.endDate,
    stats: {
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cost: Math.round(cost * 100) / 100,
      conversions,
    },
    adGroups: [],
    keywords: [],
    ads: [],
    metricsTimeline: fbMetrics.sort((a, b) => a.date.localeCompare(b.date)),
  });
}

/**
 * PATCH /api/campaigns/[id]
 * Body: { status?, dailyBudget?, name?, ... }
 * Searches both Google and Facebook campaigns
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const found = findCampaignAcrossPlatforms(params.id);
  if (!found) {
    return errorResponse('Campaign not found', 404);
  }

  try {
    const body = await request.json();
    const allowedFields = ['name', 'status', 'type', 'dailyBudget', 'startDate', 'endDate'];

    if (found.source === 'google') {
      for (const key of Object.keys(body)) {
        if (allowedFields.includes(key)) {
          (CAMPAIGNS[found.index] as any)[key] = body[key];
        }
      }
      return successResponse(CAMPAIGNS[found.index]);
    }

    // Facebook
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        (FACEBOOK_CAMPAIGNS[found.index] as any)[key] = body[key];
      }
    }
    return successResponse(FACEBOOK_CAMPAIGNS[found.index]);
  } catch {
    return errorResponse('Invalid request body');
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Searches both Google and Facebook campaigns
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const found = findCampaignAcrossPlatforms(params.id);
  if (!found) {
    return errorResponse('Campaign not found', 404);
  }

  if (found.source === 'google') {
    CAMPAIGNS.splice(found.index, 1);
  } else {
    FACEBOOK_CAMPAIGNS.splice(found.index, 1);
  }

  return successResponse({ deletedId: params.id });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
