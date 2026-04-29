import { supabase } from '@/lib/supabase';
import { CampaignsPageClient } from './campaigns-page-client';

export default async function CampaignsPage() {
  // Fetch all campaigns from Supabase — single source of truth
  const { data: dbCampaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return <div className="p-8 text-red-500">Failed to load campaigns: {error.message}</div>;
  }

  // Map DB snake_case columns → camelCase for the client component
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
