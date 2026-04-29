import { subDays, format } from 'date-fns';

export type FacebookObjective = 'CONVERSIONS' | 'AWARENESS' | 'ENGAGEMENT';
export type FacebookPlacement = 'Feed' | 'Stories' | 'Reels';
export type FacebookCampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';

export interface FacebookCampaign {
  id: string;
  name: string;
  status: FacebookCampaignStatus;
  platform: 'Facebook Ads';
  objective: FacebookObjective;
  placement: FacebookPlacement;
  dailyBudget: number;
  totalSpend: number;
  startDate: string;
  endDate?: string;
}

export interface FacebookMetrics {
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

// ─── Campaign Definitions ───────────────────────────────────────────

export const FACEBOOK_CAMPAIGNS: FacebookCampaign[] = [
  {
    id: 'fb_1',
    name: 'Retargeting — Cart Abandoners',
    status: 'ENABLED',
    platform: 'Facebook Ads',
    objective: 'CONVERSIONS',
    placement: 'Feed',
    dailyBudget: 800,
    totalSpend: 22400,
    startDate: '2026-03-01',
  },
  {
    id: 'fb_2',
    name: 'Cold Audience Reach',
    status: 'ENABLED',
    platform: 'Facebook Ads',
    objective: 'AWARENESS',
    placement: 'Stories',
    dailyBudget: 600,
    totalSpend: 17200,
    startDate: '2026-02-15',
  },
  {
    id: 'fb_3',
    name: 'Lookalike — Past Buyers',
    status: 'ENABLED',
    platform: 'Facebook Ads',
    objective: 'CONVERSIONS',
    placement: 'Reels',
    dailyBudget: 700,
    totalSpend: 19600,
    startDate: '2026-04-01',
  },
  {
    id: 'fb_4',
    name: 'Video Views — Product Demo',
    status: 'PAUSED',
    platform: 'Facebook Ads',
    objective: 'ENGAGEMENT',
    placement: 'Feed',
    dailyBudget: 400,
    totalSpend: 5600,
    startDate: '2026-03-15',
    endDate: '2026-04-15',
  },
];

// ─── Performance Profiles ───────────────────────────────────────────
// Each campaign has a distinct performance signature

interface PerfProfile {
  avgImpressions: number;
  targetCtr: number;
  targetCpc: number;
  convRate: number;
  avgConvValue: number;
}

const PERF_PROFILES: Record<string, PerfProfile> = {
  fb_1: { avgImpressions: 8000,  targetCtr: 0.032, targetCpc: 3.2,  convRate: 0.08,  avgConvValue: 120 }, // high ROAS ~4.1
  fb_2: { avgImpressions: 25000, targetCtr: 0.004, targetCpc: 0.9,  convRate: 0.005, avgConvValue: 80  }, // low performer
  fb_3: { avgImpressions: 6000,  targetCtr: 0.021, targetCpc: 2.8,  convRate: 0.06,  avgConvValue: 130 }, // ROAS ~2.8
  fb_4: { avgImpressions: 12000, targetCtr: 0.011, targetCpc: 1.5,  convRate: 0.02,  avgConvValue: 100 }, // ROAS ~1.4
};

// ─── Metrics Generation ─────────────────────────────────────────────

export const FACEBOOK_METRICS: FacebookMetrics[] = [];

FACEBOOK_CAMPAIGNS.forEach((campaign) => {
  const profile = PERF_PROFILES[campaign.id];

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');

    // Add daily variance ±20%
    const variance = () => 0.8 + Math.random() * 0.4;

    const impressions = Math.floor(profile.avgImpressions * variance());
    const clicks = Math.floor(impressions * profile.targetCtr * variance());
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const averageCpc = profile.targetCpc * variance();
    const cost = clicks * averageCpc;
    const conversions = Math.floor(clicks * profile.convRate * variance());
    const conversionRate = clicks > 0 ? conversions / clicks : 0;
    const revenue = conversions * profile.avgConvValue * variance();
    const roas = cost > 0 ? revenue / cost : 0;

    FACEBOOK_METRICS.push({
      date,
      campaignId: campaign.id,
      impressions,
      clicks,
      ctr,
      averageCpc: Math.round(averageCpc * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      conversions,
      conversionRate: Math.round(conversionRate * 10000) / 10000,
      roas: Math.round(roas * 100) / 100,
    });
  }
});
