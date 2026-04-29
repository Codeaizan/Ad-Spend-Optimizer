import { NextRequest } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_METRICS } from '@/lib/mockGoogleAds';
import { authenticate, handleCors, successResponse } from '../_lib/apiUtils';

/**
 * GET /api/overview
 * Returns account-wide totals and alerts
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  // Aggregate all metrics
  const totalImpressions = MOCK_METRICS.reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = MOCK_METRICS.reduce((sum, m) => sum + m.clicks, 0);
  const totalSpend = MOCK_METRICS.reduce((sum, m) => sum + m.cost, 0);
  const totalConversions = MOCK_METRICS.reduce((sum, m) => sum + m.conversions, 0);
  const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  // Per-campaign performance for top/bottom analysis
  const campaignPerf = MOCK_CAMPAIGNS.map(c => {
    const metrics = MOCK_METRICS.filter(m => m.campaignId === c.id);
    const impressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const clicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const cost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const conversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const roas = cost > 0 ? (conversions * 50) / cost : 0;
    const dailyCost = cost / 30; // avg daily spend over 30 days

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      dailyBudget: c.dailyBudget,
      impressions,
      clicks,
      cost: Math.round(cost * 100) / 100,
      conversions,
      ctr,
      roas: Math.round(roas * 100) / 100,
      avgDailyCost: Math.round(dailyCost * 100) / 100,
    };
  });

  // Sort to find top and bottom performers
  const sortedByConv = [...campaignPerf].sort((a, b) => b.conversions - a.conversions);
  const sortedByCtr = [...campaignPerf].sort((a, b) => a.ctr - b.ctr);

  const topPerformingCampaign = sortedByConv[0] || null;
  const lowestCTRCampaign = sortedByCtr[0] || null;

  // Budget alerts: spend > 80% of daily budget (using avg daily cost)
  const budgetAlerts = campaignPerf.filter(
    c => c.dailyBudget > 0 && c.avgDailyCost > c.dailyBudget * 0.8
  ).map(c => ({
    campaignId: c.id,
    campaignName: c.name,
    dailyBudget: c.dailyBudget,
    avgDailySpend: c.avgDailyCost,
    percentUsed: Math.round((c.avgDailyCost / c.dailyBudget) * 100),
  }));

  // Low performers: CTR < 1%
  const lowPerformers = campaignPerf.filter(c => c.ctr < 0.01).map(c => ({
    campaignId: c.id,
    campaignName: c.name,
    ctr: c.ctr,
    impressions: c.impressions,
    clicks: c.clicks,
  }));

  // Total ROAS
  const totalRevenue = totalConversions * 50; // mock avg value
  const totalROAS = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;

  return successResponse({
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalImpressions,
    totalClicks,
    avgCTR: Math.round(avgCTR * 10000) / 10000,
    avgCPC: Math.round(avgCPC * 100) / 100,
    totalConversions,
    totalROAS,
    campaignCount: MOCK_CAMPAIGNS.length,
    enabledCount: MOCK_CAMPAIGNS.filter(c => c.status === 'ENABLED').length,
    pausedCount: MOCK_CAMPAIGNS.filter(c => c.status === 'PAUSED').length,
    topPerformingCampaign,
    lowestCTRCampaign,
    budgetAlerts,
    lowPerformers,
  });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
