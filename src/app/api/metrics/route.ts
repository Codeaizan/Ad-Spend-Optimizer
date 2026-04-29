import { NextRequest } from 'next/server';
import { MOCK_METRICS } from '@/lib/mockGoogleAds';
import { authenticate, handleCors, successResponse } from '../_lib/apiUtils';
import { subDays, format } from 'date-fns';

/**
 * GET /api/metrics
 * Query: ?campaignId=&dateRange=7|30|90
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const dateRange = parseInt(searchParams.get('dateRange') || '30', 10);

  const cutoff = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');

  let metrics = MOCK_METRICS.filter(m => m.date >= cutoff);

  if (campaignId) {
    metrics = metrics.filter(m => m.campaignId === campaignId);
  }

  // Also return aggregated daily totals
  const dailyMap = new Map<string, any>();
  metrics.forEach(m => {
    const existing = dailyMap.get(m.date) || {
      date: m.date,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
    };
    existing.impressions += m.impressions;
    existing.clicks += m.clicks;
    existing.cost += m.cost;
    existing.conversions += m.conversions;
    dailyMap.set(m.date, existing);
  });

  const dailyTotals = Array.from(dailyMap.values())
    .map(d => ({
      ...d,
      cost: Math.round(d.cost * 100) / 100,
      ctr: d.impressions > 0 ? d.clicks / d.impressions : 0,
      averageCpc: d.clicks > 0 ? Math.round((d.cost / d.clicks) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return successResponse({
    dateRange,
    campaignId: campaignId || 'all',
    totalRecords: metrics.length,
    dailyTotals,
    raw: metrics.sort((a, b) => a.date.localeCompare(b.date)),
  });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
