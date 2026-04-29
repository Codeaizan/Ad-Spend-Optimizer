import { subDays, format } from 'date-fns';

export type CampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';
export type CampaignType = 'SEARCH' | 'DISPLAY' | 'PERFORMANCE_MAX' | 'VIDEO' | 'SHOPPING';
export type MatchType = 'BROAD' | 'PHRASE' | 'EXACT';
export type CompetitionLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AdStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';
export type AdGroupStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';
export type KeywordStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';

export type Platform = 'Google Ads' | 'Facebook Ads';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  platform: Platform;
  dailyBudget: number;
  totalSpend: number;
  startDate: string;
  endDate?: string;
}

export interface Metrics {
  date: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  conversionRate: number;
  roas: number;
}

export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: AdGroupStatus;
  defaultCpc: number;
  impressions: number;
  clicks: number;
  cost: number;
}

export interface Keyword {
  id: string;
  adGroupId: string;
  keyword: string;
  matchType: MatchType;
  status: KeywordStatus;
  qualityScore: number;
  impressions: number;
  clicks: number;
  cost: number;
  avgPosition: number;
}

export interface Ad {
  id: string;
  adGroupId: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  status: AdStatus;
  impressions: number;
  clicks: number;
  ctr: number;
  qualityScore: number;
}

export interface KeywordSuggestion {
  keyword: string;
  avgMonthlySearches: number;
  competition: CompetitionLevel;
  suggestedBid: number;
}

export interface AccountOverview {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
}

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

export const CAMPAIGNS: Campaign[] = [
  { id: 'c_1', name: 'Q3 Summer Sale - Search', status: 'ENABLED', type: 'SEARCH', platform: 'Google Ads', dailyBudget: 500, totalSpend: 14500, startDate: '2026-07-01' },
  { id: 'c_2', name: 'Retargeting - All Visitors', status: 'ENABLED', type: 'DISPLAY', platform: 'Google Ads', dailyBudget: 150, totalSpend: 4200, startDate: '2026-01-15' },
  { id: 'c_3', name: 'Smart Shopping - Best Sellers', status: 'ENABLED', type: 'SHOPPING', platform: 'Google Ads', dailyBudget: 1000, totalSpend: 28000, startDate: '2026-03-10' },
  { id: 'c_4', name: 'Brand Awareness - Video', status: 'PAUSED', type: 'VIDEO', platform: 'Google Ads', dailyBudget: 200, totalSpend: 1500, startDate: '2026-05-01', endDate: '2026-05-31' },
  { id: 'c_5', name: 'PMax - High Margin Products', status: 'ENABLED', type: 'PERFORMANCE_MAX', platform: 'Google Ads', dailyBudget: 800, totalSpend: 22400, startDate: '2026-06-01' },
];

export const METRICS_DATA: Metrics[] = [];
CAMPAIGNS.forEach((campaign) => {
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const impressions = Math.floor(Math.random() * 5000) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
    const ctr = clicks / impressions;
    const averageCpc = Math.random() * 2 + 0.5;
    const cost = clicks * averageCpc;
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.01));
    const conversionRate = conversions / clicks || 0;
    const revenue = conversions * (Math.random() * 150 + 50);
    const roas = revenue / cost || 0;

    METRICS_DATA.push({
      date,
      campaignId: campaign.id,
      impressions,
      clicks,
      ctr,
      averageCpc,
      cost,
      conversions,
      conversionRate,
      roas,
    });
  }
});

export const AD_GROUPS: AdGroup[] = [];
CAMPAIGNS.forEach((campaign) => {
  for (let i = 1; i <= 3; i++) {
    const impressions = Math.floor(Math.random() * 15000) + 5000;
    const clicks = Math.floor(impressions * 0.04);
    const cost = clicks * 1.5;
    AD_GROUPS.push({
      id: `ag_${campaign.id}_${i}`,
      campaignId: campaign.id,
      name: `Ad Group ${i} - ${campaign.name}`,
      status: i === 3 ? 'PAUSED' : 'ENABLED',
      defaultCpc: Math.random() * 1.5 + 0.5,
      impressions,
      clicks,
      cost,
    });
  }
});

export const KEYWORDS: Keyword[] = [];
AD_GROUPS.forEach((ag) => {
  const matchTypes: MatchType[] = ['BROAD', 'PHRASE', 'EXACT'];
  for (let i = 1; i <= 5; i++) {
    const impressions = Math.floor(Math.random() * 3000) + 500;
    const clicks = Math.floor(impressions * 0.06);
    KEYWORDS.push({
      id: `kw_${ag.id}_${i}`,
      adGroupId: ag.id,
      keyword: `ecommerce term ${Math.floor(Math.random() * 1000)}`,
      matchType: matchTypes[Math.floor(Math.random() * matchTypes.length)],
      status: 'ENABLED',
      qualityScore: Math.floor(Math.random() * 5) + 6, // 6 to 10
      impressions,
      clicks,
      cost: clicks * (Math.random() * 2 + 0.5),
      avgPosition: Math.random() * 3 + 1,
    });
  }
});

export const ADS: Ad[] = [];
AD_GROUPS.forEach((ag) => {
  for (let i = 1; i <= 2; i++) {
    const impressions = Math.floor(Math.random() * 8000) + 2000;
    const clicks = Math.floor(impressions * 0.05);
    ADS.push({
      id: `ad_${ag.id}_${i}`,
      adGroupId: ag.id,
      headlines: [`Buy Best Products Now`, `Top Rated E-commerce ${i}`, `Save 20% Today`],
      descriptions: [`Get the best deals on our high quality products.`, `Fast shipping and easy returns guaranteed.`],
      finalUrl: `https://www.example.com/product/${i}`,
      status: i === 2 ? 'PAUSED' : 'ENABLED',
      impressions,
      clicks,
      ctr: clicks / impressions,
      qualityScore: Math.floor(Math.random() * 4) + 7,
    });
  }
});

export const KEYWORD_SUGGESTIONS: KeywordSuggestion[] = [
  { keyword: 'buy running shoes online', avgMonthlySearches: 14800, competition: 'HIGH', suggestedBid: 2.45 },
  { keyword: 'affordable wireless earbuds', avgMonthlySearches: 22000, competition: 'HIGH', suggestedBid: 1.80 },
  { keyword: 'best mechanical keyboard 2026', avgMonthlySearches: 8100, competition: 'MEDIUM', suggestedBid: 1.25 },
  { keyword: 'organic skincare products', avgMonthlySearches: 12500, competition: 'HIGH', suggestedBid: 3.10 },
  { keyword: 'discounted designer bags', avgMonthlySearches: 9500, competition: 'HIGH', suggestedBid: 4.50 },
  { keyword: 'home workout equipment', avgMonthlySearches: 33000, competition: 'HIGH', suggestedBid: 2.10 },
  { keyword: 'ergonomic office chair', avgMonthlySearches: 18000, competition: 'MEDIUM', suggestedBid: 3.80 },
  { keyword: 'smart home devices sale', avgMonthlySearches: 6200, competition: 'LOW', suggestedBid: 0.90 },
  { keyword: 'cheap gaming mouse', avgMonthlySearches: 15400, competition: 'MEDIUM', suggestedBid: 0.75 },
  { keyword: 'summer dresses for women', avgMonthlySearches: 45000, competition: 'HIGH', suggestedBid: 1.60 },
];
