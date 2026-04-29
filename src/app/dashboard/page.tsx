import { supabase } from '@/lib/supabase';
import { getMetrics, getAdGroups, getKeywords } from '@/lib/adsService';
import { DashboardClient } from './dashboard-client';

interface AccountOverview {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
}

interface FacebookOverview {
  platform: 'Facebook Ads';
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  avgCPC: number;
  totalConversions: number;
  totalROAS: number;
  campaignCount: number;
  enabledCount: number;
  pausedCount: number;
  topPerformingCampaign: any;
  lowestCTRCampaign: any;
  budgetAlerts: any[];
  lowPerformers: any[];
}

async function getGoogleOverviewFromDB(): Promise<AccountOverview> {
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('platform', 'Google Ads');

  const rows = data || [];
  const totalSpend = rows.reduce((sum, c) => sum + Number(c.cost), 0);
  const totalImpressions = rows.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = rows.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = rows.reduce((sum, c) => sum + c.conversions, 0);

  return {
    totalSpend,
    totalClicks,
    totalImpressions,
    totalConversions,
    avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
  };
}

async function getFacebookOverviewFromDB(): Promise<FacebookOverview> {
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('platform', 'Facebook Ads');

  const rows = data || [];
  const totalSpend = rows.reduce((sum, c) => sum + Number(c.cost), 0);
  const totalImpressions = rows.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = rows.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = rows.reduce((sum, c) => sum + c.conversions, 0);
  const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const campaignPerf = rows.map(c => {
    const cost = Number(c.cost);
    const roas = Number(c.roas);
    const ctr = Number(c.ctr);
    return {
      id: c.id,
      campaignName: c.campaign_name,
      status: c.status,
      roas: Math.round(roas * 100) / 100,
      ctr: Math.round(ctr * 10000) / 10000,
      spend: Math.round(cost * 100) / 100,
      budget: Number(c.daily_budget),
      dailyBudget: Number(c.daily_budget),
      avgDailyCost: Math.round((cost / 30) * 100) / 100,
    };
  });

  const sortedByRoas = [...campaignPerf].sort((a, b) => b.roas - a.roas);
  const sortedByCtr = [...campaignPerf].sort((a, b) => a.ctr - b.ctr);

  const weightedRevenue = rows.reduce((sum, c) => sum + Number(c.cost) * Number(c.roas), 0);
  const totalROAS = totalSpend > 0 ? Math.round((weightedRevenue / totalSpend) * 100) / 100 : 0;

  return {
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
    topPerformingCampaign: sortedByRoas[0] || null,
    lowestCTRCampaign: sortedByCtr[0] || null,
    budgetAlerts: campaignPerf
      .filter(c => c.dailyBudget > 0 && c.avgDailyCost > c.dailyBudget * 0.8)
      .map(c => ({ campaignId: c.id, campaignName: c.campaignName, dailyBudget: c.dailyBudget, avgDailySpend: c.avgDailyCost, percentUsed: Math.round((c.avgDailyCost / c.dailyBudget) * 100) })),
    lowPerformers: campaignPerf
      .filter(c => c.ctr < 0.005 || c.roas < 1.0)
      .map(c => ({ id: c.id, campaignName: c.campaignName, ctr: c.ctr, roas: c.roas, spend: c.spend, budget: c.budget })),
  };
}

export default async function DashboardPage() {
  // Fetch Google campaigns from in-memory for chart metrics (read-only time-series data)
  const [googleOverview, facebookOverview, campaigns, metrics] = await Promise.all([
    getGoogleOverviewFromDB(),
    getFacebookOverviewFromDB(),
    (async () => {
      const { data } = await supabase.from('campaigns').select('*').eq('platform', 'Google Ads');
      return (data || []).map(c => ({
        id: c.id,
        name: c.campaign_name,
        status: c.status as 'ENABLED' | 'PAUSED' | 'REMOVED',
        type: c.type,
        platform: c.platform as 'Google Ads',
        dailyBudget: Number(c.daily_budget),
        totalSpend: Number(c.cost),
        startDate: c.created_at,
      }));
    })(),
    getMetrics(), // Time-series metrics stay in-memory (read-only reference data)
  ]);

  // Fetch all keywords (Google Ads only — read-only reference data)
  const adGroupsNested = await Promise.all(campaigns.map(c => getAdGroups(c.id)));
  const adGroups = adGroupsNested.flat();
  
  const keywordsNested = await Promise.all(adGroups.map(ag => getKeywords(ag.id)));
  const keywords = keywordsNested.flat();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DashboardClient 
        googleOverview={googleOverview}
        facebookOverview={facebookOverview}
        campaigns={campaigns}
        metrics={metrics}
        keywords={keywords}
      />
    </div>
  );
}
