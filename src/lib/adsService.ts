import {
  MOCK_CAMPAIGNS,
  MOCK_METRICS,
  MOCK_AD_GROUPS,
  MOCK_KEYWORDS,
  MOCK_ADS,
  MOCK_KEYWORD_SUGGESTIONS,
  Campaign,
  Metrics,
  AdGroup,
  Keyword,
  Ad,
  KeywordSuggestion,
  AccountOverview,
  CampaignStatus,
} from './mockGoogleAds';

const DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let campaigns = [...MOCK_CAMPAIGNS];

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
  let result = [...MOCK_METRICS];
  
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
  return MOCK_AD_GROUPS.filter((ag) => ag.campaignId === campaignId);
}

export async function getKeywords(adGroupId: string): Promise<Keyword[]> {
  await delay(DELAY_MS);
  return MOCK_KEYWORDS.filter((kw) => kw.adGroupId === adGroupId);
}

export async function getAds(adGroupId: string): Promise<Ad[]> {
  await delay(DELAY_MS);
  return MOCK_ADS.filter((ad) => ad.adGroupId === adGroupId);
}

export async function getKeywordSuggestions(): Promise<KeywordSuggestion[]> {
  await delay(DELAY_MS);
  return [...MOCK_KEYWORD_SUGGESTIONS];
}

export async function getAccountOverview(): Promise<AccountOverview> {
  await delay(DELAY_MS);
  
  const totalSpend = campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
  
  // Aggregate metrics to get clicks, impressions, conversions
  const allMetrics = MOCK_METRICS.filter(m => campaigns.some(c => c.id === m.campaignId));
  
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
