import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: 'no_key' }, { status: 200 });
  }

  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

    const now = Math.floor(Date.now() / 1000);
    const startOfMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000);
    const startOfLastMonth = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime() / 1000);

    // Fetch in parallel
    const [
      allCharges,
      thisMonthCharges,
      lastMonthCharges,
      openInvoices,
      activeSubscriptions,
    ] = await Promise.all([
      stripe.charges.list({ limit: 100, created: { gte: now - 365 * 24 * 3600 } }),
      stripe.charges.list({ limit: 100, created: { gte: startOfMonth }, status: 'succeeded' }),
      stripe.charges.list({ limit: 100, created: { gte: startOfLastMonth, lt: startOfMonth }, status: 'succeeded' }),
      stripe.invoices.list({ limit: 100, status: 'open' }),
      stripe.subscriptions.list({ limit: 100, status: 'active' }),
    ]);

    const totalRevenue = allCharges.data
      .filter(c => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const thisMonthRevenue = thisMonthCharges.data.reduce((sum, c) => sum + c.amount, 0) / 100;
    const lastMonthRevenue = lastMonthCharges.data.reduce((sum, c) => sum + c.amount, 0) / 100;

    const outstandingAmount = openInvoices.data.reduce((sum, inv) => sum + (inv.amount_due ?? 0), 0) / 100;

    const monthChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : null;

    return NextResponse.json({
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      monthChange,
      outstandingAmount,
      outstandingCount: openInvoices.data.length,
      activeSubscriptions: activeSubscriptions.data.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
