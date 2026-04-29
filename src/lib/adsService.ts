import {
  CAMPAIGNS,
  METRICS_DATA,
  AD_GROUPS,
  KEYWORDS,
  ADS,
  KEYWORD_SUGGESTIONS,
  Campaign,
  Metrics,
  AdGroup,
  Keyword,
  Ad,
  KeywordSuggestion,
  AccountOverview,
  CampaignStatus,
} from './googleAdsData';

const DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let campaigns = [...CAMPAIGNS];

export async function getCampaigns(): Promise<Campaign[]> {
  await delay(DELAY_MS);
  return [...campaigns];
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  await delay(DELAY_MS);
  return campaigns.find((c) => c.id === id);
}

export async function getMetrics(campaignId?: string, dateRange?: { start: string; end: string }): Promise<Metrics[]> {
  await delay(DELAY_MS);
  let result = [...METRICS_DATA];
  
  if (campaignId) {
    result = result.filter((m) => m.campaignId === campaignId);
  }
  
  if (dateRange) {
    result = result.filter((m) => m.date >= dateRange.start && m.date <= dateRange.end);
  }
  
  return result;
}

export async function getAdGroups(campaignId: string): Promise<AdGroup[]> {
  await delay(DELAY_MS);
  return AD_GROUPS.filter((ag) => ag.campaignId === campaignId);
}

export async function getKeywords(adGroupId: string): Promise<Keyword[]> {
  await delay(DELAY_MS);
  return KEYWORDS.filter((kw) => kw.adGroupId === adGroupId);
}

export async function getAds(adGroupId: string): Promise<Ad[]> {
  await delay(DELAY_MS);
  return ADS.filter((ad) => ad.adGroupId === adGroupId);
}

export async function getKeywordSuggestions(): Promise<KeywordSuggestion[]> {
  await delay(DELAY_MS);
  return [...KEYWORD_SUGGESTIONS];
}

export async function getAccountOverview(): Promise<AccountOverview> {
  await delay(DELAY_MS);
  
  const totalSpend = campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
  
  // Aggregate metrics to get clicks, impressions, conversions
  const allMetrics = METRICS_DATA.filter(m => campaigns.some(c => c.id === m.campaignId));
  
  const totalClicks = allMetrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalImpressions = allMetrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalConversions = allMetrics.reduce((sum, m) => sum + m.conversions, 0);
  
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  return {
    totalSpend,
    totalClicks,
    totalImpressions,
    totalConversions,
    avgCtr,
    avgCpc,
  };
}

export async function createCampaign(data: Omit<Campaign, 'id'>): Promise<Campaign> {
  await delay(DELAY_MS);
  const newCampaign: Campaign = {
    ...data,
    id: `c_${Math.random().toString(36).substr(2, 9)}`,
  };
  campaigns.push(newCampaign);
  return newCampaign;
}

export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign | null> {
  await delay(DELAY_MS);
  const index = campaigns.findIndex((c) => c.id === id);
  if (index !== -1) {
    campaigns[index] = { ...campaigns[index], status };
    return campaigns[index];
  }
  return null;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  await delay(DELAY_MS);
  const initialLength = campaigns.length;
  campaigns = campaigns.filter((c) => c.id !== id);
  return campaigns.length < initialLength;
}

// ─── Facebook Ads Service Functions ─────────────────────────────────

import {
  FACEBOOK_CAMPAIGNS,
  FACEBOOK_METRICS,
  FacebookCampaign,
  FacebookMetrics,
} from './facebookAdsData';
import { subDays, format } from 'date-fns';

export async function getFacebookCampaigns(): Promise<FacebookCampaign[]> {
  await delay(DELAY_MS);
  return [...FACEBOOK_CAMPAIGNS];
}

export async function getFacebookMetrics(
  campaignId?: string,
  dateRange?: number
): Promise<FacebookMetrics[]> {
  await delay(DELAY_MS);

  const days = dateRange || 30;
  const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
  let result = FACEBOOK_METRICS.filter(m => m.date >= cutoff);

  if (campaignId) {
    result = result.filter(m => m.campaignId === campaignId);
  }

  return result;
}

export interface FacebookOverview {
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

export async function getFacebookOverview(): Promise<FacebookOverview> {
  await delay(DELAY_MS);

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

  // Budget alerts: spend > 80%
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

  // Total ROAS
  const totalRevenue = FACEBOOK_METRICS.reduce((s, m) => s + (m.cost * m.roas), 0);
  const totalROAS = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;

  return {
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
  };
}
