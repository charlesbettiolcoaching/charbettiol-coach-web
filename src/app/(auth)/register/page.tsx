'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profession: '',
  });

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        'Up to 5 active clients',
        'Training program builder',
        'Weekly check-ins',
        'Nutrition & macro tracking',
        'Habit tracking',
        'Client messaging',
      ],
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      description: 'Most popular for growing coaches',
      features: [
        'Unlimited clients',
        'All Starter features',
        'AI Coach Assistant (24/7)',
        'Custom brand colours & logo',
        'Priority support',
        'Early access to new features',
      ],
      highlighted: true,
    },
    {
      id: 'team',
      name: 'Team',
      price: 79,
      description: 'For multi-practitioner clinics',
      features: [
        'Unlimited clients',
        'Up to 5 coaches',
        'All Pro features',
        'Team dashboard',
        'Dedicated onboarding',
        'Phone support',
      ],
      highlighted: false,
    },
  ];

  const professions = [
    'Personal Trainer',
    'Dietitian',
    'Nutritionist',
    'Exercise Physiologist',
    'Strength Coach',
    'Physiotherapist',
    'Online Fitness Coach',
    'Other',
  ];

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.profession) errors.profession = 'Please select your profession';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      setFormErrors({});
    }
  };

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          plan: planId,
          profession: formData.profession,
        }),
      });
      if (!res.ok) throw new Error('Failed to create checkout session');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setFormErrors({ checkout: 'Failed to redirect to payment. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light flex flex-col">

      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Propel" className="w-8 h-8" />
              <span className="text-xl font-bold text-cb-text font-display">Propel</span>
            </Link>
            <p className="text-sm text-cb-muted hidden sm:block">
              Already have an account?{' '}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Step 1 */}
            <div className={`step-dot ${step >= 1 ? (step > 1 ? 'done' : 'active') : 'inactive'}`}>
              {step > 1 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              ) : '1'}
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${step === 1 ? 'text-brand' : step > 1 ? 'text-cb-muted' : 'text-cb-muted'}`}>Your details</p>
            </div>
            <div className={`step-connector ${step > 1 ? 'done' : ''}`} />
            {/* Step 2 */}
            <div className={`step-dot ${step === 2 ? 'active' : 'inactive'}`}>
              2
            </div>
            <div className="flex-1">
              <p className={`text-xs font-semibold ${step === 2 ? 'text-brand' : 'text-cb-muted'}`}>Choose plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">
          {step === 1 ? (
            <div className="bg-surface rounded-2xl border border-border shadow-md p-8 sm:p-10">
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-cb-text mb-2">
                  Create your account
                </h1>
                <p className="text-cb-secondary text-sm">
                  Join health professionals running their practice on Propel.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-cb-text mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`field ${formErrors.name ? 'error' : ''}`}
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                  {formErrors.name && (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-cb-text mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`field ${formErrors.email ? 'error' : ''}`}
                    placeholder="jane@example.com"
                    autoComplete="email"
                  />
                  {formErrors.email && (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-cb-text mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`field ${formErrors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {formErrors.password ? (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {formErrors.password}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-cb-muted">At least 8 characters</p>
                  )}
                </div>

                {/* Profession */}
                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-cb-text mb-1.5">
                    Profession
                  </label>
                  <select
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className={`field ${formErrors.profession ? 'error' : ''}`}
                  >
                    <option value="">Select your profession</option>
                    {professions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {formErrors.profession && (
                    <p className="mt-1.5 text-xs text-cb-danger flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {formErrors.profession}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary mt-2"
                >
                  Continue to plan selection
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-cb-secondary">
                  Already have an account?{' '}
                  <Link href="/login" className="text-brand font-semibold hover:underline">
                    Coach login
                  </Link>
                </p>
              </div>
            </div>

          ) : (
            <div>
              <div className="mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline mb-4 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <h1 className="font-display text-3xl font-bold text-cb-text mb-1.5">
                  Choose your plan
                </h1>
                <p className="text-sm text-cb-secondary">
                  14-day free trial on every plan. No credit card required.
                </p>
              </div>

              {formErrors.checkout && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  <p className="text-sm text-red-700">{formErrors.checkout}</p>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-5">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl transition-all cursor-pointer flex flex-col bg-surface border ${
                      plan.highlighted
                        ? 'border-brand ring-2 ring-brand/20 shadow-lg shadow-brand/10'
                        : selectedPlan === plan.id
                        ? 'border-brand ring-2 ring-brand/20 shadow-md'
                        : 'border-border shadow-sm hover:border-brand/40 hover:shadow-md'
                    }`}
                    onClick={() => !isLoading && handlePlanSelect(plan.id)}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                        <span className="bg-brand text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm">
                          Most popular
                        </span>
                      </div>
                    )}

                    <div className="p-7 flex flex-col flex-1">
                      <div className="mb-5">
                        <h3 className="font-display text-xl font-bold text-cb-text mb-1">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-cb-muted">{plan.description}</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-4xl font-extrabold text-cb-text">
                            {plan.price === 0 ? 'Free' : `$${plan.price}`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-sm text-cb-muted">AUD/mo</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); if (!isLoading) handlePlanSelect(plan.id); }}
                        disabled={isLoading && selectedPlan !== plan.id}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all mb-6 cursor-pointer ${
                          plan.highlighted || selectedPlan === plan.id
                            ? 'bg-brand text-white hover:bg-brand-light shadow-sm shadow-brand/20'
                            : 'bg-surface-light text-cb-text hover:bg-border'
                        } ${isLoading && selectedPlan === plan.id ? 'opacity-70' : ''}`}
                      >
                        {isLoading && selectedPlan === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            Processing…
                          </span>
                        ) : plan.price === 0 ? 'Start for free' : 'Start free trial'}
                      </button>

                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <svg className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm text-cb-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-center gap-2 text-sm text-cb-muted">
                <svg className="w-4 h-4 text-cb-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                Payment info is encrypted and secure via Stripe
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
