import { getCampaigns, getMetrics, getFacebookCampaigns, getFacebookMetrics } from '@/lib/adsService';
import { CampaignsPageClient } from './campaigns-page-client';

export default async function CampaignsPage() {
  const [googleCampaigns, googleMetrics, facebookCampaigns, facebookMetrics] = await Promise.all([
    getCampaigns(),
    getMetrics(),
    getFacebookCampaigns(),
    getFacebookMetrics(),
  ]);

  // Attach metrics to Google campaigns
  const googleWithMetrics = googleCampaigns.map(c => {
    const campMetrics = googleMetrics.filter(m => m.campaignId === c.id);
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

  // Attach metrics to Facebook campaigns (normalize to same shape)
  const facebookWithMetrics = facebookCampaigns.map(c => {
    const campMetrics = facebookMetrics.filter(m => m.campaignId === c.id);
    const impressions = campMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const clicks = campMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const cost = campMetrics.reduce((sum, m) => sum + m.cost, 0);
    const conversions = campMetrics.reduce((sum, m) => sum + m.conversions, 0);
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const avgCpc = clicks > 0 ? cost / clicks : 0;

    return {
      id: c.id,
      name: c.name,
      status: c.status as 'ENABLED' | 'PAUSED' | 'REMOVED',
      type: c.objective as string,
      platform: c.platform as 'Google Ads' | 'Facebook Ads',
      dailyBudget: c.dailyBudget,
      totalSpend: c.totalSpend,
      startDate: c.startDate,
      endDate: c.endDate,
      impressions,
      clicks,
      cost,
      conversions,
      ctr,
      avgCpc,
    };
  });

  const allCampaigns = [...googleWithMetrics, ...facebookWithMetrics];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CampaignsPageClient initialCampaigns={allCampaigns} />
    </div>
  );
}
