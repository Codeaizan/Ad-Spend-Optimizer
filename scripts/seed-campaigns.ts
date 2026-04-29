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

const allCampaigns = [
  {
    id: 'g_1',
    campaign_name: 'Google – Summer Sale Search',
    platform: 'Google Ads',
    status: 'ENABLED',
    type: 'SEARCH',
    daily_budget: 5000,
    cost: 4800,
    impressions: 95000,
    clicks: 4750,
    conversions: 320,
    roas: 4.8,
    avg_cpc: 1.01,
    ctr: 0.05, // 5.0%
  },
  {
    id: 'g_2',
    campaign_name: 'Google – Brand Remarketing',
    platform: 'Google Ads',
    status: 'ENABLED',
    type: 'DISPLAY',
    daily_budget: 3000,
    cost: 2950,
    impressions: 60000,
    clicks: 1200,
    conversions: 28,
    roas: 1.4,
    avg_cpc: 2.46,
    ctr: 0.02, // 2.0%
  },
  {
    id: 'g_3',
    campaign_name: 'Google – PMax Broad Reach',
    platform: 'Google Ads',
    status: 'ENABLED',
    type: 'PERFORMANCE_MAX',
    daily_budget: 4000,
    cost: 3900,
    impressions: 80000,
    clicks: 640,
    conversions: 4,
    roas: 0.4,
    avg_cpc: 6.09,
    ctr: 0.008, // 0.8%
  },
  {
    id: 'fb_1',
    campaign_name: 'Facebook – Lookalike Buyers',
    platform: 'Facebook Ads',
    status: 'ENABLED',
    type: 'CONVERSIONS',
    daily_budget: 4500,
    cost: 4300,
    impressions: 110000,
    clicks: 5500,
    conversions: 290,
    roas: 5.1,
    avg_cpc: 0.78,
    ctr: 0.05, // 5.0%
  },
  {
    id: 'fb_2',
    campaign_name: 'Facebook – Cold Audience Video',
    platform: 'Facebook Ads',
    status: 'ENABLED',
    type: 'AWARENESS',
    daily_budget: 3500,
    cost: 3400,
    impressions: 72000,
    clicks: 1080,
    conversions: 21,
    roas: 1.3,
    avg_cpc: 3.15,
    ctr: 0.015, // 1.5%
  },
  {
    id: 'fb_3',
    campaign_name: 'Facebook – Interest Targeting Test',
    platform: 'Facebook Ads',
    status: 'ENABLED',
    type: 'CONVERSIONS',
    daily_budget: 2500,
    cost: 2450,
    impressions: 55000,
    clicks: 330,
    conversions: 2,
    roas: 0.3,
    avg_cpc: 7.42,
    ctr: 0.006, // 0.6%
  }
];

async function seed() {
  console.log('🚀 Seeding campaigns table...\n');

  // Delete all existing campaigns first
  console.log('🗑️ Deleting all existing campaigns...');
  const { error: deleteError } = await supabase
    .from('campaigns')
    .delete()
    .neq('id', '0'); // Hack to delete all rows since we must provide a filter
    
  if (deleteError) {
    console.error('❌ Failed to delete existing campaigns:', deleteError.message);
    process.exit(1);
  }

  // Upsert all campaigns
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
