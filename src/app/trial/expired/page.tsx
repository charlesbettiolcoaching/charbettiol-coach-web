import Link from 'next/link'
import { Check } from 'lucide-react'
import {
  COACH_TIERS,
  COACH_TIER_FEATURE_COPY,
  formatPrice,
  type CoachTier,
} from '@/lib/pricing'

export const metadata = {
  title: 'Trial Expired',
  description: 'Your Propel trial has ended. Choose a plan to continue.',
}

const coachPlanIds = ['coach_starter', 'coach_pro', 'coach_scale'] as const satisfies readonly CoachTier[]

const PRICING_PLANS = coachPlanIds.map((id) => {
  const tier = COACH_TIERS[id]
  return {
    name: tier.name,
    slug: id.replace('coach_', ''),
    price: formatPrice(tier.monthlyCents),
    period: '/month',
    highlight: tier.popular,
    features: COACH_TIER_FEATURE_COPY[id],
  }
})

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
      {/* ── Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <img src="/logo.png" alt="Propel" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-gray-900 text-lg tracking-tight">Propel</span>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <span className="text-2xl">📅</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">Your free trial has ended</h1>
          <p className="text-xl text-gray-500 mb-12">You had 14 days of full access. Ready to continue?</p>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PRICING_PLANS.map(plan => (
              <div
                key={plan.slug}
                className={`rounded-2xl border transition-all ${
                  plan.highlight
                    ? 'bg-[#119D93] text-white border-[#119D93] shadow-2xl shadow-[#119D93]/25 md:scale-105'
                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="p-8">
                  {plan.highlight && (
                    <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      ⭐ Most Popular
                    </div>
                  )}

                  <h3 className={`text-2xl font-black mb-6 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>

                  <div className="flex items-end gap-1 mb-8">
                    <span className={`text-5xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm mb-2 ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>
                      {plan.period}
                    </span>
                  </div>

                  <Link
                    href="/register"
                    className={`w-full font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-8 ${
                      plan.highlight
                        ? 'bg-white text-[#119D93] hover:bg-gray-50'
                        : 'bg-[#119D93] text-white hover:bg-[#0D7F78]'
                    } block text-center`}
                  >
                    Choose {plan.name}
                  </Link>

                  <ul className="space-y-4">
                    {plan.features.map(feature => (
                      <li
                        key={feature}
                        className={`flex items-start gap-3 text-sm ${
                          plan.highlight ? 'text-white/90' : 'text-gray-700'
                        }`}
                      >
                        <Check
                          size={18}
                          className={`flex-shrink-0 mt-0.5 ${
                            plan.highlight ? 'text-white' : 'text-[#119D93]'
                          }`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support Link ────────────────────── */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600 mb-4">Questions about which plan is right for you?</p>
          <button className="text-[#119D93] hover:underline font-medium">
            Talk to us
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Propel" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-gray-900">Propel</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Propel. Built for coaches, by coaches.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
