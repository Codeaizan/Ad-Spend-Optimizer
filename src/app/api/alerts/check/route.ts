import { NextRequest } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_METRICS } from '@/lib/mockGoogleAds';
import { authenticate, handleCors, successResponse } from '../../_lib/apiUtils';
import { subDays, format } from 'date-fns';

interface Alert {
  campaignId: string;
  campaignName: string;
  type: 'BUDGET_WARNING' | 'LOW_CTR' | 'NO_CONVERSIONS';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * POST /api/alerts/check
 * Checks all campaigns for performance issues and budget alerts
 */
export async function POST(request: NextRequest) {
  const authError = authenticate(request);
  if (authError) return authError;

  const alerts: Alert[] = [];
  const now = new Date();
  const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');

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

    // Check 1: Spend > 80% of daily budget
    if (campaign.dailyBudget > 0 && avgDailyCost > campaign.dailyBudget * 0.8) {
      const pct = Math.round((avgDailyCost / campaign.dailyBudget) * 100);
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        type: 'BUDGET_WARNING',
        message: `Average daily spend (₹${avgDailyCost.toFixed(2)}) is ${pct}% of daily budget (₹${campaign.dailyBudget}). Consider increasing the budget.`,
        severity: pct > 95 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Check 2: CTR < 0.5%
    if (totalImpressions > 100 && ctr < 0.005) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        type: 'LOW_CTR',
        message: `CTR is ${(ctr * 100).toFixed(2)}%, well below the 0.5% threshold. Review ad copy and targeting.`,
        severity: ctr < 0.002 ? 'HIGH' : 'MEDIUM',
      });
    }

    // Check 3: Zero conversions in last 7 days
    if (recentConversions === 0 && recentMetrics.length > 0) {
      alerts.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        type: 'NO_CONVERSIONS',
        message: `No conversions recorded in the last 7 days. Check landing pages and conversion tracking.`,
        severity: 'HIGH',
      });
    }
  }

  // Sort by severity (HIGH first)
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return successResponse({
    checkedAt: now.toISOString(),
    campaignsChecked: MOCK_CAMPAIGNS.filter(c => c.status !== 'REMOVED').length,
    alertCount: alerts.length,
    alerts,
  });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
