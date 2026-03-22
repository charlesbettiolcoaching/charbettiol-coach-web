import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 200 });

  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const charges = await stripe.charges.list({ limit: 50, expand: ['data.customer'] });

    const payments = charges.data.map(c => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency.toUpperCase(),
      status: c.status,
      description: c.description,
      customerName: (c.customer as Stripe.Customer)?.name ?? (c.billing_details?.name ?? 'Unknown'),
      customerEmail: (c.customer as Stripe.Customer)?.email ?? (c.billing_details?.email ?? ''),
      date: c.created,
      receiptUrl: c.receipt_url,
    }));

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
