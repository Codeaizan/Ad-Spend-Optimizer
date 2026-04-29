import { getCampaigns, getMetrics, getAdGroups, getKeywords, getAds } from '@/lib/adsService';
import { ReportsClient } from './reports-client';

export default async function ReportsPage() {
  const campaigns = await getCampaigns();
  const metrics = await getMetrics();
  
  const adGroupsNested = await Promise.all(campaigns.map(c => getAdGroups(c.id)));
  const adGroups = adGroupsNested.flat();
  
  const keywordsNested = await Promise.all(adGroups.map(ag => getKeywords(ag.id)));
  const adsNested = await Promise.all(adGroups.map(ag => getAds(ag.id)));
  
  const keywords = keywordsNested.flat();
  const ads = adsNested.flat();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ReportsClient 
        campaigns={campaigns}
        metrics={metrics}
        keywords={keywords}
        ads={ads}
      />
    </div>
  );
}
