import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 200 });

  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const subscriptions = await stripe.subscriptions.list({
      limit: 50,
      expand: ['data.customer', 'data.default_payment_method'],
    });

    const data = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      customerName: (sub.customer as Stripe.Customer)?.name ?? 'Unknown',
      customerEmail: (sub.customer as Stripe.Customer)?.email ?? '',
      plan: sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? 'Plan',
      amount: (sub.items.data[0]?.price?.unit_amount ?? 0) / 100,
      currency: (sub.items.data[0]?.price?.currency ?? 'aud').toUpperCase(),
      interval: sub.items.data[0]?.price?.recurring?.interval ?? 'month',
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      created: sub.created,
    }));

    return NextResponse.json({ subscriptions: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
