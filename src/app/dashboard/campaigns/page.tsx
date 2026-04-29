import { supabase } from '@/lib/supabase';
import { getMetrics } from '@/lib/adsService';
import { FACEBOOK_METRICS } from '@/lib/facebookAdsData';
import { CampaignsPageClient } from './campaigns-page-client';

export default async function CampaignsPage() {
  // Fetch all campaigns from Supabase
  const { data: dbCampaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('platform')
    .order('campaign_name');

  if (error) {
    return <div className="p-8 text-red-500">Failed to load campaigns: {error.message}</div>;
  }

  // Map DB rows to the shape expected by the client component
  const allCampaigns = (dbCampaigns || []).map(row => ({
    id: row.id,
    name: row.campaign_name,
    status: row.status as 'ENABLED' | 'PAUSED' | 'REMOVED',
    type: row.type,
    platform: row.platform as 'Google Ads' | 'Facebook Ads',
    dailyBudget: Number(row.daily_budget),
    totalSpend: Number(row.cost),
    startDate: row.created_at,
    impressions: row.impressions,
    clicks: row.clicks,
    cost: Number(row.cost),
    conversions: row.conversions,
    ctr: Number(row.ctr),
    avgCpc: Number(row.avg_cpc),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CampaignsPageClient initialCampaigns={allCampaigns} />
    </div>
  );
}
