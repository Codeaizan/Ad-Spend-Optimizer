import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// For client-side components and safe operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side API routes and bypassing RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
