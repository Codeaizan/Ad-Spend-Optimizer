import { supabase } from '@/lib/supabase';
import { getCampaigns, getMetrics, getAdGroups, getKeywords } from '@/lib/adsService';
import { getFacebookOverview } from '@/lib/adsService';
import { DashboardClient } from './dashboard-client';
import { AccountOverview } from '@/lib/googleAdsData';

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

export default async function DashboardPage() {
  // Fetch both platform overviews + Google metrics for charts
  const [googleOverview, facebookOverview, campaigns, metrics] = await Promise.all([
    getGoogleOverviewFromDB(),
    getFacebookOverview(),
    getCampaigns(),
    getMetrics(),
  ]);

  // Fetch all keywords (Google Ads only — Facebook doesn't have keywords)
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
