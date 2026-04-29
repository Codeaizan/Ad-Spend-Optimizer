import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticate, handleCors, successResponse, errorResponse } from '../_lib/apiUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/facebook-overview
 * Returns Facebook Ads account-wide totals (Facebook Ads ONLY)
 * Reads from Supabase campaigns table
 */
export async function GET(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('platform', 'Facebook Ads');

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  const rows = campaigns || [];

  // Aggregate totals
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
    const avgDailyCost = cost / 30;

    return {
      id: c.id,
      campaignName: c.campaign_name,
      status: c.status,
      objective: c.type,
      dailyBudget: Number(c.daily_budget),
      impressions: c.impressions,
      clicks: c.clicks,
      spend: Math.round(cost * 100) / 100,
      conversions: c.conversions,
      ctr: Math.round(ctr * 10000) / 10000,
      roas: Math.round(roas * 100) / 100,
      avgDailyCost: Math.round(avgDailyCost * 100) / 100,
      budget: Number(c.daily_budget),
    };
  });

  const sortedByRoas = [...campaignPerf].sort((a, b) => b.roas - a.roas);
  const sortedByCtr = [...campaignPerf].sort((a, b) => a.ctr - b.ctr);

  const topPerformingCampaign = sortedByRoas[0] || null;
  const lowestCTRCampaign = sortedByCtr[0] || null;

  // Budget alerts
  const budgetAlerts = campaignPerf
    .filter(c => c.dailyBudget > 0 && c.avgDailyCost > c.dailyBudget * 0.8)
    .map(c => ({
      campaignId: c.id,
      campaignName: c.campaignName,
      dailyBudget: c.dailyBudget,
      avgDailySpend: c.avgDailyCost,
      percentUsed: Math.round((c.avgDailyCost / c.dailyBudget) * 100),
    }));

  // Low performers
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
  const weightedRevenue = rows.reduce((sum, c) => sum + Number(c.cost) * Number(c.roas), 0);
  const totalROAS = totalSpend > 0 ? Math.round((weightedRevenue / totalSpend) * 100) / 100 : 0;

  return NextResponse.json(
    {
      success: true,
      data: {
        platform: 'Facebook Ads',
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
