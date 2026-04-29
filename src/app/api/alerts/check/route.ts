import { NextRequest } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_METRICS } from '@/lib/mockGoogleAds';
import { FACEBOOK_CAMPAIGNS, FACEBOOK_METRICS } from '@/lib/mockFacebookAds';
import { authenticate, handleCors, successResponse } from '../../_lib/apiUtils';
import { subDays, format } from 'date-fns';

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
 * Checks ALL campaigns (Google + Facebook) for performance issues
 */
export async function POST(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const alerts: Alert[] = [];
  const now = new Date();
  const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');

  // ─── Google Ads Checks ──────────────────────────────────────────

  for (const campaign of MOCK_CAMPAIGNS) {
    if (campaign.status === 'REMOVED') continue;

    const allMetrics = MOCK_METRICS.filter(m => m.campaignId === campaign.id && m.date >= thirtyDaysAgo);
    const recentMetrics = MOCK_METRICS.filter(m => m.campaignId === campaign.id && m.date >= sevenDaysAgo);

    const totalCost = allMetrics.reduce((sum, m) => sum + m.cost, 0);
    const totalImpressions = allMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = allMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const avgDailyCost = allMetrics.length > 0 ? totalCost / 30 : 0;
    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const recentConversions = recentMetrics.reduce((sum, m) => sum + m.conversions, 0);

    // Google: ROAS check
    const avgRoas = allMetrics.length > 0
      ? allMetrics.reduce((s, m) => s + m.roas, 0) / allMetrics.length
      : 0;

    // Budget warning: spend > 80% of daily budget
    if (campaign.dailyBudget > 0 && avgDailyCost > campaign.dailyBudget * 0.8) {
      const pct = Math.round((avgDailyCost / campaign.dailyBudget) * 100);
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Google Ads',
        type: 'BUDGET_WARNING',
        message: `Average daily spend (₹${avgDailyCost.toFixed(2)}) is ${pct}% of daily budget (₹${campaign.dailyBudget}). Consider increasing the budget.`,
        severity: pct > 95 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Low CTR: < 0.5%
    if (totalImpressions > 100 && ctr < 0.005) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Google Ads',
        type: 'LOW_CTR',
        message: `CTR is ${(ctr * 100).toFixed(2)}%, well below the 0.5% threshold. Review ad copy and targeting.`,
        severity: ctr < 0.002 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Low ROAS: < 1.0
    if (avgRoas < 1.0 && totalCost > 100) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Google Ads',
        type: 'LOW_ROAS',
        message: `ROAS is ${avgRoas.toFixed(2)}x, below the 1.0x break-even threshold. Campaign is losing money.`,
        severity: 'HIGH',
      });
    }

    // No conversions in last 7 days
    if (recentConversions === 0 && recentMetrics.length > 0) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Google Ads',
        type: 'NO_CONVERSIONS',
        message: `No conversions recorded in the last 7 days. Check landing pages and conversion tracking.`,
        severity: 'HIGH',
      });
    }
  }

  // ─── Facebook Ads Checks ────────────────────────────────────────

  for (const campaign of FACEBOOK_CAMPAIGNS) {
    if (campaign.status === 'REMOVED') continue;

    const allMetrics = FACEBOOK_METRICS.filter(m => m.campaignId === campaign.id && m.date >= thirtyDaysAgo);
    const recentMetrics = FACEBOOK_METRICS.filter(m => m.campaignId === campaign.id && m.date >= sevenDaysAgo);

    const totalCost = allMetrics.reduce((sum, m) => sum + m.cost, 0);
    const totalImpressions = allMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = allMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const avgDailyCost = allMetrics.length > 0 ? totalCost / 30 : 0;
    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const recentConversions = recentMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const avgRoas = allMetrics.length > 0
      ? allMetrics.reduce((s, m) => s + m.roas, 0) / allMetrics.length
      : 0;

    // Facebook: LOW_ROAS < 1.0
    if (avgRoas < 1.0 && totalCost > 50) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Facebook Ads',
        type: 'LOW_ROAS',
        message: `ROAS is ${avgRoas.toFixed(2)}x, below break-even. This Facebook campaign is unprofitable.`,
        severity: 'HIGH',
      });
    }

    // Facebook: LOW_CTR < 0.5%
    if (totalImpressions > 100 && ctr < 0.005) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Facebook Ads',
        type: 'LOW_CTR',
        message: `CTR is ${(ctr * 100).toFixed(2)}%, below the 0.5% threshold. Review creative and audience targeting.`,
        severity: 'HIGH',
      });
    }

    // Facebook: BUDGET_WARNING > 80%
    if (campaign.dailyBudget > 0 && avgDailyCost > campaign.dailyBudget * 0.8) {
      const pct = Math.round((avgDailyCost / campaign.dailyBudget) * 100);
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Facebook Ads',
        type: 'BUDGET_WARNING',
        message: `Average daily spend (₹${avgDailyCost.toFixed(2)}) is ${pct}% of daily budget (₹${campaign.dailyBudget}).`,
        severity: 'MEDIUM',
      });
    }

    // Facebook: NO_CONVERSIONS in last 7 days
    if (recentConversions === 0 && recentMetrics.length > 0) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: 'Facebook Ads',
        type: 'NO_CONVERSIONS',
        message: `No conversions recorded in the last 7 days on Facebook. Check pixel and attribution settings.`,
        severity: 'HIGH',
      });
    }
  }

  // Sort by severity (HIGH first)
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const googleCount = MOCK_CAMPAIGNS.filter(c => c.status !== 'REMOVED').length;
  const fbCount = FACEBOOK_CAMPAIGNS.filter(c => c.status !== 'REMOVED').length;

  return successResponse({
    checkedAt: now.toISOString(),
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
