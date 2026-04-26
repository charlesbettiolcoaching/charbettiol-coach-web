'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'

export interface PricingPlan {
  name: string
  slug: string
  checkoutPlan: string
  monthlyPrice: string
  annualPrice: string
  period: string
  description: string
  highlight: boolean
  trial: string
  features: string[]
}

export function PricingBanner() {
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = useState(false)
  const source = searchParams.get('source')

  if (dismissed || !source) return null

  const copy = source === 'ios-billing'
    ? 'Pick an AI plan to keep going after your trial.'
    : 'Choose a plan to start.'

  return (
    <div className="px-6 pt-24">
      <div className="mx-auto flex max-w-4xl items-start justify-between gap-4 rounded-2xl border border-[#0F7B8C]/20 bg-[#0F7B8C]/5 p-4 text-left">
        <p className="text-sm font-medium text-gray-800">{copy}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm font-bold text-[#0F7B8C] hover:text-[#0d6b7a]"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export default function PricingClient({
  coachPlans,
  aiPlans,
}: {
  coachPlans: PricingPlan[]
  aiPlans: PricingPlan[]
}) {
  const searchParams = useSearchParams()
  const initialSegment = searchParams.get('plan') === 'ai' ? 'ai' : 'coach'
  const [segment, setSegment] = useState<'coach' | 'ai'>(initialSegment)
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const plans = segment === 'ai' ? aiPlans : coachPlans
  const billing = 'monthly'

  const handleCheckout = async (plan: PricingPlan) => {
    setLoading(plan.slug)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.checkoutPlan, billing }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Could not start checkout. Please try again or contact support.')
      }
    } catch {
      setCheckoutError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="mb-10 flex justify-center">
        <div className="inline-flex rounded-2xl bg-gray-100 p-1">
          {[
            { key: 'ai' as const, label: 'AI plans (for individuals)' },
            { key: 'coach' as const, label: 'Coach plans (for trainers)' },
          ].map(option => {
            const active = segment === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSegment(option.key)
                  setCheckoutError(null)
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:px-5 ${
                  active
                    ? 'bg-white text-[#0F7B8C] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map(plan => (
          <div key={plan.slug} className="relative">
            {/* Most Popular badge — sits on the top border */}
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="whitespace-nowrap bg-[#0F7B8C] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  Most Popular
                </span>
              </div>
            )}

            <div
              className={`rounded-2xl border-2 transition-all h-full ${
                plan.highlight
                  ? 'border-[#0F7B8C] shadow-xl shadow-[#0F7B8C]/15'
                  : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
              }`}
            >
              <div className="p-8">
                {/* Plan name + description */}
                <h3 className="text-2xl font-black text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-5xl font-black text-gray-900">
                    {plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-gray-500 mb-2">{plan.period}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">{plan.annualPrice}/year</p>
                <p className="text-xs font-bold text-[#0F7B8C] mb-6">{plan.trial}</p>

                {/* CTA */}
                {segment === 'coach' && plan.slug === 'starter' ? (
                  <Link
                    href="/trial/setup?plan=starter"
                    className={`block w-full text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-8 ${
                      plan.highlight
                        ? 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Get started free
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loading === plan.slug}
                    className={`block w-full text-center font-bold py-3 px-6 rounded-xl text-sm transition-colors mb-8 disabled:opacity-70 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? 'bg-[#0F7B8C] text-white hover:bg-[#0d6b7a]'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {loading === plan.slug ? 'Starting…' : segment === 'ai' ? 'Continue' : 'Start free trial'}
                  </button>
                )}

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check
                        size={17}
                        className="flex-shrink-0 mt-0.5 text-[#0F7B8C]"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {checkoutError && (
        <p className="text-center text-sm text-red-600 mt-6">{checkoutError}</p>
      )}
    </>
  )
}
