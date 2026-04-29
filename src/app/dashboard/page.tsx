import { getCampaigns, getMetrics, getAdGroups, getKeywords, getAccountOverview } from '@/lib/adsService';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  // Fetch overview metrics
  const overview = await getAccountOverview();
  
  // Fetch all campaigns
  const campaigns = await getCampaigns();
  
  // Fetch all metrics
  const metrics = await getMetrics();
  
  // Fetch all keywords to find top keywords
  const adGroupsNested = await Promise.all(campaigns.map(c => getAdGroups(c.id)));
  const adGroups = adGroupsNested.flat();
  
  const keywordsNested = await Promise.all(adGroups.map(ag => getKeywords(ag.id)));
  const keywords = keywordsNested.flat();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DashboardClient 
        overview={overview}
        campaigns={campaigns}
        metrics={metrics}
        keywords={keywords}
      />
    </div>
  );
}
