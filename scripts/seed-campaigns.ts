/**
 * scripts/seed-campaigns.ts
 * Creates the campaigns table (if needed) and seeds it with data.
 * Run: npx tsx scripts/seed-campaigns.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Campaign seed data ──────────────────────────────────────────────
// Google Ads campaigns with pre-calculated metrics from METRICS_DATA
const googleCampaigns = [
  {
    id: 'c_1',
    campaign_name: 'Q3 Summer Sale - Search',
    status: 'ENABLED',
    platform: 'Google Ads',
    type: 'SEARCH',
    daily_budget: 500,
    impressions: 118796,
    clicks: 3593,
    ctr: 0.0302,
    avg_cpc: 1.41,
    cost: 5074.64,
    conversions: 220,
    roas: 2.17,
  },
  {
    id: 'c_2',
    campaign_name: 'Retargeting - All Visitors',
    status: 'ENABLED',
    platform: 'Google Ads',
    type: 'DISPLAY',
    daily_budget: 150,
    impressions: 106132,
    clicks: 3288,
    ctr: 0.031,
    avg_cpc: 1.38,
    cost: 4553.11,
    conversions: 184,
    roas: 2.02,
  },
  {
    id: 'c_3',
    campaign_name: 'Smart Shopping - Best Sellers',
    status: 'ENABLED',
    platform: 'Google Ads',
    type: 'SHOPPING',
    daily_budget: 1000,
    impressions: 103509,
    clicks: 3601,
    ctr: 0.0348,
    avg_cpc: 1.43,
    cost: 5157.72,
    conversions: 227,
    roas: 2.2,
  },
  {
    id: 'c_4',
    campaign_name: 'Brand Awareness - Video',
    status: 'PAUSED',
    platform: 'Google Ads',
    type: 'VIDEO',
    daily_budget: 200,
    impressions: 99825,
    clicks: 3834,
    ctr: 0.0384,
    avg_cpc: 1.41,
    cost: 5392.40,
    conversions: 241,
    roas: 2.23,
  },
  {
    id: 'c_5',
    campaign_name: 'PMax - High Margin Products',
    status: 'ENABLED',
    platform: 'Google Ads',
    type: 'PERFORMANCE_MAX',
    daily_budget: 800,
    impressions: 108102,
    clicks: 4113,
    ctr: 0.038,
    avg_cpc: 1.53,
    cost: 6292.89,
    conversions: 239,
    roas: 1.9,
  },
];

// Facebook Ads campaigns with pre-calculated metrics from FACEBOOK_METRICS
const facebookCampaigns = [
  {
    id: 'fb_1',
    campaign_name: 'Retargeting — Cart Abandoners',
    status: 'ENABLED',
    platform: 'Facebook Ads',
    type: 'CONVERSIONS',
    daily_budget: 800,
    impressions: 234299,
    clicks: 7529,
    ctr: 0.0321,
    avg_cpc: 3.15,
    cost: 23690.08,
    conversions: 580,
    roas: 4.1,
  },
  {
    id: 'fb_2',
    campaign_name: 'Cold Audience Reach',
    status: 'ENABLED',
    platform: 'Facebook Ads',
    type: 'AWARENESS',
    daily_budget: 600,
    impressions: 763036,
    clicks: 3053,
    ctr: 0.004,
    avg_cpc: 0.9,
    cost: 2762.84,
    conversions: 0,
    roas: 0.0,
  },
  {
    id: 'fb_3',
    campaign_name: 'Lookalike — Past Buyers',
    status: 'ENABLED',
    platform: 'Facebook Ads',
    type: 'CONVERSIONS',
    daily_budget: 700,
    impressions: 182391,
    clicks: 3935,
    ctr: 0.0216,
    avg_cpc: 2.86,
    cost: 11241.17,
    conversions: 216,
    roas: 2.8,
  },
  {
    id: 'fb_4',
    campaign_name: 'Video Views — Product Demo',
    status: 'PAUSED',
    platform: 'Facebook Ads',
    type: 'ENGAGEMENT',
    daily_budget: 400,
    impressions: 368633,
    clicks: 4037,
    ctr: 0.011,
    avg_cpc: 1.46,
    cost: 5877.72,
    conversions: 66,
    roas: 1.4,
  },
];

async function seed() {
  console.log('🚀 Seeding campaigns table...\n');

  const allCampaigns = [...googleCampaigns, ...facebookCampaigns];

  // Upsert all campaigns (insert or update if id already exists)
  const { data, error } = await supabase
    .from('campaigns')
    .upsert(allCampaigns, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('❌ Seed failed:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    process.exit(1);
  }

  console.log(`✅ Seeded ${data?.length || 0} campaigns successfully!\n`);

  // Verify by reading back
  const { data: campaigns, error: readError } = await supabase
    .from('campaigns')
    .select('id, campaign_name, platform, status')
    .order('platform')
    .order('campaign_name');

  if (readError) {
    console.error('❌ Verification read failed:', readError.message);
    process.exit(1);
  }

  console.log('📋 Campaigns in database:');
  console.table(campaigns);
}

seed();
