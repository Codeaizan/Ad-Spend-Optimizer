import { NextRequest } from 'next/server';
import { MOCK_KEYWORDS, MOCK_AD_GROUPS } from '@/lib/mockGoogleAds';
import { authenticate, handleCors, successResponse } from '../_lib/apiUtils';

/**
 * GET /api/keywords
 * Query: ?adGroupId= or ?campaignId=
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const adGroupId = searchParams.get('adGroupId');
  const campaignId = searchParams.get('campaignId');

  let keywords = [...MOCK_KEYWORDS];

  if (adGroupId) {
    keywords = keywords.filter(kw => kw.adGroupId === adGroupId);
  } else if (campaignId) {
    // Find all ad groups for this campaign, then get their keywords
    const adGroupIds = MOCK_AD_GROUPS
      .filter(ag => ag.campaignId === campaignId)
      .map(ag => ag.id);
    keywords = keywords.filter(kw => adGroupIds.includes(kw.adGroupId));
  }

  // Enrich with parent ad group name
  const enriched = keywords.map(kw => {
    const adGroup = MOCK_AD_GROUPS.find(ag => ag.id === kw.adGroupId);
    return {
      ...kw,
      adGroupName: adGroup?.name || 'Unknown',
      campaignId: adGroup?.campaignId || 'Unknown',
    };
  });

  return successResponse(enriched);
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
