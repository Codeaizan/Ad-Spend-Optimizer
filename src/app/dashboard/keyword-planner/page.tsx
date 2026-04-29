import { getCampaigns, getAdGroups } from '@/lib/adsService';
import { KeywordPlannerClient } from './keyword-planner-client';

export default async function KeywordPlannerPage() {
  const campaigns = await getCampaigns();
  
  // Fetch all ad groups
  const adGroupsNested = await Promise.all(campaigns.map(c => getAdGroups(c.id)));
  const adGroups = adGroupsNested.flat();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <KeywordPlannerClient campaigns={campaigns} adGroups={adGroups} />
    </div>
  );
}
