import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticate, handleCors, successResponse, errorResponse } from '../../_lib/apiUtils';

interface Alert {
  campaignId: string;
  campaignName: string;
  platform: 'Google Ads' | 'Facebook Ads';
  type: 'BUDGET_WARNING' | 'LOW_CTR' | 'LOW_ROAS' | 'NO_CONVERSIONS';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * POST /api/alerts/check
 * Checks ALL campaigns from Supabase for performance issues
 */
export async function POST(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { data: allCampaigns, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .neq('status', 'REMOVED');

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  const campaigns = allCampaigns || [];
  const alerts: Alert[] = [];

  for (const c of campaigns) {
    const cost = Number(c.cost);
    const impressions = c.impressions;
    const clicks = c.clicks;
    const conversions = c.conversions;
    const dailyBudget = Number(c.daily_budget);
    const ctr = Number(c.ctr);
    const roas = Number(c.roas);
    const avgDailyCost = cost / 30;
    const platform = c.platform as 'Google Ads' | 'Facebook Ads';

    // Budget warning: avg daily spend > 80% of daily budget
    if (dailyBudget > 0 && avgDailyCost > dailyBudget * 0.8) {
      const pct = Math.round((avgDailyCost / dailyBudget) * 100);
      alerts.push({
        campaignId: c.id,
        campaignName: c.campaign_name,
        platform,
        type: 'BUDGET_WARNING',
        message: `Average daily spend (₹${avgDailyCost.toFixed(2)}) is ${pct}% of daily budget (₹${dailyBudget}). Consider increasing the budget.`,
        severity: pct > 95 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Low CTR: < 0.5%
    if (impressions > 100 && ctr < 0.005) {
      alerts.push({
        campaignId: c.id,
        campaignName: c.campaign_name,
        platform,
        type: 'LOW_CTR',
        message: `CTR is ${(ctr * 100).toFixed(2)}%, below the 0.5% threshold. Review ad copy and targeting.`,
        severity: ctr < 0.002 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Low ROAS: < 1.0
    if (roas < 1.0 && cost > 50) {
      alerts.push({
        campaignId: c.id,
        campaignName: c.campaign_name,
        platform,
        type: 'LOW_ROAS',
        message: `ROAS is ${roas.toFixed(2)}x, below the 1.0x break-even threshold. Campaign is losing money.`,
        severity: 'HIGH',
      });
    }

    // No conversions
    if (conversions === 0 && cost > 100) {
      alerts.push({
        campaignId: c.id,
        campaignName: c.campaign_name,
        platform,
        type: 'NO_CONVERSIONS',
        message: `No conversions recorded. Check landing pages and conversion tracking.`,
        severity: 'HIGH',
      });
    }
  }

  // Sort by severity (HIGH first)
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const googleCount = campaigns.filter(c => c.platform === 'Google Ads').length;
  const fbCount = campaigns.filter(c => c.platform === 'Facebook Ads').length;

  return successResponse({
    checkedAt: new Date().toISOString(),
    campaignsChecked: {
      total: googleCount + fbCount,
      googleAds: googleCount,
      facebookAds: fbCount,
    },
    alertCount: alerts.length,
    alertsByPlatform: {
      googleAds: alerts.filter(a => a.platform === 'Google Ads').length,
      facebookAds: alerts.filter(a => a.platform === 'Facebook Ads').length,
    },
    alerts,
  });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
