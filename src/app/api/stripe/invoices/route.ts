import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 200 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const invoiceId = searchParams.get('id');

  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

    if (action === 'send' && invoiceId) {
      await stripe.invoices.sendInvoice(invoiceId);
      return NextResponse.json({ success: true });
    }

    const invoices = await stripe.invoices.list({ limit: 50, expand: ['data.customer'] });

    const data = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      amount: (inv.amount_due ?? 0) / 100,
      amountPaid: (inv.amount_paid ?? 0) / 100,
      currency: (inv.currency ?? 'aud').toUpperCase(),
      status: inv.status,
      customerName: (inv.customer as Stripe.Customer)?.name ?? 'Unknown',
      customerEmail: (inv.customer as Stripe.Customer)?.email ?? '',
      dueDate: inv.due_date,
      created: inv.created,
      hostedUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf,
      description: inv.description ?? inv.lines?.data?.[0]?.description ?? '',
    }));

    return NextResponse.json({ invoices: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'no_key' }, { status: 200 });

  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const body = await request.json();

    // Find or create customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({ email: body.email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({ name: body.name, email: body.email });
    }

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      description: body.description,
      due_date: body.dueDate ? Math.floor(new Date(body.dueDate).getTime() / 1000) : undefined,
      collection_method: 'send_invoice',
      days_until_due: body.dueDate ? undefined : 7,
    });

    // Add line item
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: Math.round(body.amount * 100),
      currency: 'aud',
      description: body.description,
    });

    // Finalize
    const finalised = await stripe.invoices.finalizeInvoice(invoice.id);

    return NextResponse.json({ invoice: finalised });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
