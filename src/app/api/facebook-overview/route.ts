import { NextRequest } from 'next/server';
import { FACEBOOK_CAMPAIGNS, FACEBOOK_METRICS } from '@/lib/facebookAdsData';
import { authenticate, handleCors, successResponse } from '../_lib/apiUtils';

/**
 * GET /api/facebook-overview
 * Returns Facebook Ads account-wide totals, top/bottom performers, and alerts (Facebook Ads ONLY)
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const totalImpressions = FACEBOOK_METRICS.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = FACEBOOK_METRICS.reduce((s, m) => s + m.clicks, 0);
  const totalSpend = FACEBOOK_METRICS.reduce((s, m) => s + m.cost, 0);
  const totalConversions = FACEBOOK_METRICS.reduce((s, m) => s + m.conversions, 0);

  const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  // Per-campaign performance
  const campaignPerf = FACEBOOK_CAMPAIGNS.map(c => {
    const metrics = FACEBOOK_METRICS.filter(m => m.campaignId === c.id);
    const imp = metrics.reduce((s, m) => s + m.impressions, 0);
    const clk = metrics.reduce((s, m) => s + m.clicks, 0);
    const cst = metrics.reduce((s, m) => s + m.cost, 0);
    const conv = metrics.reduce((s, m) => s + m.conversions, 0);
    const ctr = imp > 0 ? clk / imp : 0;
    const avgRoas = metrics.length > 0
      ? metrics.reduce((s, m) => s + m.roas, 0) / metrics.length
      : 0;
    const avgDailyCost = cst / 30;

    return {
      id: c.id,
      campaignName: c.name,
      status: c.status,
      objective: c.objective,
      placement: c.placement,
      dailyBudget: c.dailyBudget,
      impressions: imp,
      clicks: clk,
      spend: Math.round(cst * 100) / 100,
      conversions: conv,
      ctr: Math.round(ctr * 10000) / 10000,
      roas: Math.round(avgRoas * 100) / 100,
      avgDailyCost: Math.round(avgDailyCost * 100) / 100,
      budget: c.dailyBudget,
    };
  });

  const sortedByRoas = [...campaignPerf].sort((a, b) => b.roas - a.roas);
  const sortedByCtr = [...campaignPerf].sort((a, b) => a.ctr - b.ctr);

  const topPerformingCampaign = sortedByRoas[0] || null;
  const lowestCTRCampaign = sortedByCtr[0] || null;

  // Budget alerts: avg daily spend > 80% of budget
  const budgetAlerts = campaignPerf
    .filter(c => c.dailyBudget > 0 && c.avgDailyCost > c.dailyBudget * 0.8)
    .map(c => ({
      campaignId: c.id,
      campaignName: c.campaignName,
      dailyBudget: c.dailyBudget,
      avgDailySpend: c.avgDailyCost,
      percentUsed: Math.round((c.avgDailyCost / c.dailyBudget) * 100),
    }));

  // Low performers: CTR < 0.5% or ROAS < 1.0
  const lowPerformers = campaignPerf
    .filter(c => c.ctr < 0.005 || c.roas < 1.0)
    .map(c => ({
      id: c.id,
      campaignName: c.campaignName,
      ctr: c.ctr,
      roas: c.roas,
      spend: c.spend,
      budget: c.budget,
    }));

  // Total ROAS (weighted)
  const totalRevenue = FACEBOOK_METRICS.reduce((s, m) => s + (m.cost * m.roas), 0);
  const totalROAS = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;

  return successResponse({
    platform: 'Facebook Ads',
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalImpressions,
    totalClicks,
    avgCTR: Math.round(avgCTR * 10000) / 10000,
    avgCPC: Math.round(avgCPC * 100) / 100,
    totalConversions,
    totalROAS,
    campaignCount: FACEBOOK_CAMPAIGNS.length,
    enabledCount: FACEBOOK_CAMPAIGNS.filter(c => c.status === 'ENABLED').length,
    pausedCount: FACEBOOK_CAMPAIGNS.filter(c => c.status === 'PAUSED').length,
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
