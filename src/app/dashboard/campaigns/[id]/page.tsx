import { getCampaignById, getMetrics, getAdGroups, getKeywords, getAds } from '@/lib/adsService';
import { CampaignDetailClient } from './campaign-detail-client';
import { notFound } from 'next/navigation';

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id);
  
  if (!campaign) {
    notFound();
  }

  // Fetch all related data
  const metrics = await getMetrics(params.id);
  const adGroups = await getAdGroups(params.id);
  
  // Fetch keywords and ads for all ad groups
  const keywordsPromises = adGroups.map(ag => getKeywords(ag.id));
  const adsPromises = adGroups.map(ag => getAds(ag.id));
  
  const keywordsArrays = await Promise.all(keywordsPromises);
  const adsArrays = await Promise.all(adsPromises);
  
  const keywords = keywordsArrays.flat();
  const ads = adsArrays.flat();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CampaignDetailClient 
        initialCampaign={campaign} 
        metrics={metrics} 
        adGroups={adGroups} 
        keywords={keywords} 
        ads={ads} 
      />
    </div>
  );
}
