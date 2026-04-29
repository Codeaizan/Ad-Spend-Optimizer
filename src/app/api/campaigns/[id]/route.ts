import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticate, handleCors, successResponse, errorResponse } from '../../_lib/apiUtils';

/**
 * Helper: map a DB row to the API response shape
 */
function mapRow(row: any) {
  return {
    id: row.id,
    name: row.campaign_name,
    status: row.status,
    type: row.type,
    platform: row.platform,
    dailyBudget: Number(row.daily_budget),
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: Number(row.ctr),
    avgCpc: Number(row.avg_cpc),
    cost: Number(row.cost),
    conversions: row.conversions,
    roas: Number(row.roas),
    createdAt: row.created_at,
  };
}

/**
 * GET /api/campaigns/[id]
 * Returns a single campaign from Supabase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return errorResponse('Campaign not found', 404);
  }

  return successResponse(mapRow(data));
}

/**
 * PATCH /api/campaigns/[id]
 * Body: { status?, dailyBudget?, name?, ... }
 * Persists updates to Supabase
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Map camelCase API fields → snake_case DB columns
    const updateFields: Record<string, any> = {};
    if (body.name !== undefined) updateFields.campaign_name = body.name;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.dailyBudget !== undefined) updateFields.daily_budget = body.dailyBudget;

    if (Object.keys(updateFields).length === 0) {
      return errorResponse('No valid fields to update');
    }

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return errorResponse(`Database error: ${error.message}`, 500);
    }

    if (!data) {
      return errorResponse('Campaign not found', 404);
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/campaigns');

    return successResponse(mapRow(data));
  } catch (err: any) {
    return errorResponse(`Server error: ${err.message || 'Unknown error'}`, 500);
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Removes a campaign from Supabase
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authenticate(request);
  if (authError) return authError;

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .delete()
    .eq('id', params.id);

  if (error) {
    return errorResponse(`Database error: ${error.message}`, 500);
  }

  return successResponse({ deletedId: params.id });
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return handleCors();
}
