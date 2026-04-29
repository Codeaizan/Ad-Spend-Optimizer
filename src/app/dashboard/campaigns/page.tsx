import { getCampaigns, getMetrics } from '@/lib/adsService';
import { CampaignsPageClient } from './campaigns-page-client';

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  const metrics = await getMetrics();

  // Attach metrics to campaigns for the table
  const campaignsWithMetrics = campaigns.map(c => {
    const campMetrics = metrics.filter(m => m.campaignId === c.id);
    const impressions = campMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const clicks = campMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const cost = campMetrics.reduce((sum, m) => sum + m.cost, 0);
    const conversions = campMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const avgCpc = clicks > 0 ? cost / clicks : 0;

    return {
      ...c,
      impressions,
      clicks,
      cost,
      conversions,
      ctr,
      avgCpc,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CampaignsPageClient initialCampaigns={campaignsWithMetrics} />
    </div>
  );
}
