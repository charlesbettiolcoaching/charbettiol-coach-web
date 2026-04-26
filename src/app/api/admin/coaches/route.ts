export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { AI_TIERS, COACH_TIERS } from '@/lib/pricing';

// Lazy Supabase client — only created at request time, not at module import time.
// This prevents build failures when env vars aren't available during static analysis.
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Plan pricing map (in AUD cents)
const planPricing: Record<string, number> = {
  ai_starter: AI_TIERS.ai_starter.monthlyCents,
  ai_pro: AI_TIERS.ai_pro.monthlyCents,
  ai_elite: AI_TIERS.ai_elite.monthlyCents,
  coach_starter: COACH_TIERS.coach_starter.monthlyCents,
  coach_pro: COACH_TIERS.coach_pro.monthlyCents,
  coach_scale: COACH_TIERS.coach_scale.monthlyCents,
};

interface CoachData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  plan?: string;
  subscription_status?: string;
  subscription_id?: string;
  stripe_customer_id?: string;
  clients_count: number;
  created_at: string;
}

async function isAdmin(userId: string): Promise<boolean> {
  // Check ADMIN_USER_IDS env var (comma-separated list of admin user IDs)
  const adminUserIds = process.env.ADMIN_USER_IDS;
  if (adminUserIds) {
    const ids = adminUserIds.split(',').map((id) => id.trim());
    if (ids.includes(userId)) return true;
  }

  // Check profiles.role = 'admin' in the database
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (data?.role === 'admin') return true;
  } catch {
    // fall through
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate via Supabase session
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const adminAccess = await isAdmin(user.id);
    if (!adminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all coaches with their profile and subscription data
    const { data: coaches, error: coachError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        plan,
        subscription_status,
        subscription_id,
        stripe_customer_id,
        created_at
      `)
      .eq('role', 'coach')
      .order('created_at', { ascending: false });

    if (coachError) {
      console.error('Error fetching coaches:', coachError);
      return NextResponse.json(
        { error: 'Failed to fetch coaches' },
        { status: 500 }
      );
    }

    // For each coach, get their clients count
    const coachesWithClients = await Promise.all(
      (coaches || []).map(async (coach) => {
        const { count, error: countError } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', coach.id);

        if (countError) {
          console.error(`Error counting clients for coach ${coach.id}:`, countError);
        }

        return {
          ...coach,
          clients_count: count || 0,
        } as CoachData;
      })
    );

    // Calculate stats
    const totalCoaches = coachesWithClients.length;
    const activeSubscriptions = coachesWithClients.filter(
      (c) => c.subscription_status === 'active' || c.subscription_status === 'trialing'
    ).length;
    const trialCoaches = coachesWithClients.filter(
      (c) => c.subscription_status === 'trialing'
    ).length;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = coachesWithClients
      .filter((c) => c.subscription_status === 'active' || c.subscription_status === 'trialing')
      .reduce((sum, coach) => {
        const plan = coach.plan?.toLowerCase() || 'coach_starter';
        const monthlyPrice = planPricing[plan] || planPricing['coach_starter'];
        return sum + monthlyPrice / 100; // Convert cents to dollars
      }, 0);

    // Fetch recent activity (signups in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSignups } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at, role')
      .eq('role', 'coach')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalCoaches,
        activeSubscriptions,
        mrr: parseFloat(mrr.toFixed(2)),
        trialCoaches,
      },
      coaches: coachesWithClients,
      recentSignups: recentSignups || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
