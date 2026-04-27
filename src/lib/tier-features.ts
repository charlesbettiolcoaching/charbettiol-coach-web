/**
 * Tier-based feature-access resolver (web).
 *
 * Pure function — call with a subscription_tier string (from a Supabase
 * query on the profiles table) and it returns a typed feature bundle.
 * Mirrors `mobile-app/hooks/useTierFeatures.ts` but without the React
 * plumbing — Next.js components can call this anywhere (server action,
 * server component, client component with a profile prop).
 *
 * Anything gated by paid tier belongs here: coach branding, AI assistant,
 * client-count cap, team seats, payments, API access, etc.
 *
 * If `tier` is null/unknown the resolver returns all-false / zero-quota
 * defaults — safer than accidentally granting access.
 */

import {
  AI_FEATURES,
  COACH_FEATURES,
  AI_TIERS,
  COACH_TIERS,
  canAccessAI,
  canAccessCoach,
  getAIQuota,
  getCoachQuota,
  classifyTier,
  type AITier,
  type CoachTier,
  type AIFeatureFlags,
  type CoachFeatureFlags,
} from './pricing'

export interface TierFeatures {
  tier: string | null
  tierKind: 'ai' | 'coach' | 'unknown'
  aiTier: AITier | null
  coachTier: CoachTier | null

  canAccessAIChat: boolean
  aiChatDailyQuota: number
  canAccessWeeklyCheckinAI: boolean
  canAccessVideoFormAnalysis: boolean
  wearableIntegrationLevel: 'none' | 'read_only' | 'full_sync'
  hasPriorityAIResponse: boolean
  analyticsLevel: 'basic' | 'full' | 'full_trends' | 'none'

  canAccessCoachBranding: boolean
  canAccessCoachAIAssistant: boolean
  canAccessCheckinAutomation: boolean
  canAccessPaymentsInvoicing: boolean
  canAccessB2CDiscountCoupon: boolean
  canAccessPrioritySupport: boolean
  canAccessConciergeOnboarding: boolean
  canAccessAPIAccess: boolean

  aiProgramMonthlyQuota: number
  aiMealPlanMonthlyQuota: number

  coachClientCap: number | null
  coachTeamSeats: number

  aiFlags: AIFeatureFlags | null
  coachFlags: CoachFeatureFlags | null
}

const DEFAULTS: TierFeatures = {
  tier: null,
  tierKind: 'unknown',
  aiTier: null,
  coachTier: null,

  canAccessAIChat: false,
  aiChatDailyQuota: 0,
  canAccessWeeklyCheckinAI: false,
  canAccessVideoFormAnalysis: false,
  wearableIntegrationLevel: 'none',
  hasPriorityAIResponse: false,
  analyticsLevel: 'none',

  canAccessCoachBranding: false,
  canAccessCoachAIAssistant: false,
  canAccessCheckinAutomation: false,
  canAccessPaymentsInvoicing: false,
  canAccessB2CDiscountCoupon: false,
  canAccessPrioritySupport: false,
  canAccessConciergeOnboarding: false,
  canAccessAPIAccess: false,

  aiProgramMonthlyQuota: 0,
  aiMealPlanMonthlyQuota: 0,

  coachClientCap: 0,
  coachTeamSeats: 0,

  aiFlags: null,
  coachFlags: null,
}

export function resolveTierFeatures(tier: string | null | undefined): TierFeatures {
  if (!tier) return DEFAULTS

  const kind = classifyTier(tier)
  if (kind === 'unknown') return DEFAULTS

  if (kind === 'ai') {
    const t = tier as AITier
    const f = AI_FEATURES[t]
    return {
      ...DEFAULTS,
      tier,
      tierKind: 'ai',
      aiTier: t,
      canAccessAIChat: canAccessAI(t, 'ai_coach_chat'),
      aiChatDailyQuota: getAIQuota(t, 'ai_coach_chat_daily_quota'),
      canAccessWeeklyCheckinAI: canAccessAI(t, 'weekly_checkin_ai'),
      canAccessVideoFormAnalysis: canAccessAI(t, 'video_form_analysis'),
      wearableIntegrationLevel: f.wearable_integration,
      hasPriorityAIResponse: canAccessAI(t, 'priority_ai_response'),
      analyticsLevel: f.progress_analytics,
      aiFlags: f,
    }
  }

  // coach
  const t = tier as CoachTier
  const f = COACH_FEATURES[t]
  const def = COACH_TIERS[t]
  return {
    ...DEFAULTS,
    tier,
    tierKind: 'coach',
    coachTier: t,
    canAccessCoachBranding: canAccessCoach(t, 'custom_branding'),
    canAccessCoachAIAssistant: canAccessCoach(t, 'ai_coach_assistant'),
    canAccessCheckinAutomation: canAccessCoach(t, 'checkin_automation'),
    canAccessPaymentsInvoicing: canAccessCoach(t, 'payments_invoicing'),
    canAccessB2CDiscountCoupon: canAccessCoach(t, 'b2c_discount_coupon'),
    canAccessPrioritySupport: canAccessCoach(t, 'priority_support'),
    canAccessConciergeOnboarding: canAccessCoach(t, 'concierge_onboarding'),
    canAccessAPIAccess: canAccessCoach(t, 'api_access'),
    aiProgramMonthlyQuota: getCoachQuota(t, 'ai_program_generation_monthly_quota'),
    aiMealPlanMonthlyQuota: getCoachQuota(t, 'ai_meal_plan_generation_monthly_quota'),
    coachClientCap: def.maxClients,
    coachTeamSeats: def.teamSeats,
    coachFlags: f,
  }
}
