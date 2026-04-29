import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, handleCors, successResponse, errorResponse } from '../_lib/apiUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/overview
 * Returns Google Ads account-wide totals (Google Ads ONLY)
 * Reads from Supabase campaigns table
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('platform', 'Google Ads');

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  const rows = campaigns || [];

  // Aggregate totals from DB rows
  const totalSpend = rows.reduce((sum, c) => sum + Number(c.cost), 0);
  const totalImpressions = rows.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = rows.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = rows.reduce((sum, c) => sum + c.conversions, 0);
  const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  // Per-campaign performance
  const campaignPerf = rows.map(c => {
    const cost = Number(c.cost);
    const roas = Number(c.roas);
    const ctr = Number(c.ctr);
    const dailyCost = cost / 30;

    return {
      id: c.id,
      name: c.campaign_name,
      status: c.status,
      dailyBudget: Number(c.daily_budget),
      impressions: c.impressions,
      clicks: c.clicks,
      cost: Math.round(cost * 100) / 100,
      conversions: c.conversions,
      ctr,
      roas: Math.round(roas * 100) / 100,
      avgDailyCost: Math.round(dailyCost * 100) / 100,
    };
  });

  // Top and bottom performers
  const sortedByConv = [...campaignPerf].sort((a, b) => b.conversions - a.conversions);
  const sortedByCtr = [...campaignPerf].sort((a, b) => a.ctr - b.ctr);

  const topPerformingCampaign = sortedByConv[0] || null;
  const lowestCTRCampaign = sortedByCtr[0] || null;

  // Budget alerts: spend > 80% of daily budget
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
  const totalRevenue = totalConversions * 50;
  const totalROAS = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;

  return NextResponse.json(
    {
      success: true,
      data: {
        platform: 'Google Ads',
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        avgCTR: Math.round(avgCTR * 10000) / 10000,
        avgCPC: Math.round(avgCPC * 100) / 100,
        totalConversions,
        totalROAS,
        campaignCount: rows.length,
        enabledCount: rows.filter(c => c.status === 'ENABLED').length,
        pausedCount: rows.filter(c => c.status === 'PAUSED').length,
        topPerformingCampaign,
        lowestCTRCampaign,
        budgetAlerts,
        lowPerformers,
      }
    },
    { 
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    }
  );
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
