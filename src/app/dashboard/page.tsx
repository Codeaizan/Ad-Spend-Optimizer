import { getCampaigns, getMetrics, getAdGroups, getKeywords, getAccountOverview, getFacebookOverview } from '@/lib/adsService';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  // Fetch both platform overviews in parallel
  const [googleOverview, facebookOverview, campaigns, metrics] = await Promise.all([
    getAccountOverview(),
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
