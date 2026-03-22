'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, FileText, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, AlertCircle, CheckCircle2, Clock, Users,
  ExternalLink, Send, Plus, X, ChevronDown, Loader2,
  ArrowUpRight, Zap, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

/* ─── Types ─────────────────────────────────── */
interface Overview {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  monthChange: number | null;
  outstandingAmount: number;
  outstandingCount: number;
  activeSubscriptions: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  customerName: string;
  customerEmail: string;
  date: number;
  receiptUrl: string | null;
}

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  amountPaid: number;
  currency: string;
  status: string | null;
  customerName: string;
  customerEmail: string;
  dueDate: number | null;
  created: number;
  hostedUrl: string | null;
  pdfUrl: string | null;
  description: string;
}

interface Subscription {
  id: string;
  status: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  created: number;
}

type Tab = 'overview' | 'payments' | 'invoices' | 'subscriptions';

/* ─── Helpers ────────────────────────────────── */
const fmt = (n: number, currency = 'AUD') =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(n);

const statusColor = (s: string | null) => {
  switch (s) {
    case 'succeeded': case 'paid': case 'active': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
    case 'open': case 'trialing': return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';
    case 'past_due': case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400';
    case 'canceled': case 'void': return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
};

const statusLabel = (s: string | null) => {
  const map: Record<string, string> = {
    succeeded: 'Paid', paid: 'Paid', active: 'Active', open: 'Outstanding',
    past_due: 'Past Due', failed: 'Failed', canceled: 'Cancelled',
    void: 'Void', trialing: 'Trial',
  };
  return map[s ?? ''] ?? s ?? '—';
};

/* ─── Connect Stripe CTA ────────────────────── */
function NoKeyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center mb-5">
        <CreditCard className="w-8 h-8 text-[var(--brand)]" />
      </div>
      <h2 className="text-xl font-bold text-cb-text mb-2">Connect Stripe</h2>
      <p className="text-cb-text-secondary text-sm max-w-sm mb-6">
        Add your Stripe secret key to Vercel to start seeing payments, invoices, and subscriptions here.
      </p>
      <div className="bg-cb-surface border border-cb-border rounded-xl p-5 text-left w-full max-w-md mb-6">
        <p className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide mb-3">How to connect</p>
        <ol className="space-y-2 text-sm text-cb-text">
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>Go to your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-[var(--brand)] underline font-medium">Stripe API Keys</a> page</li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>Copy your <strong>Secret key</strong> (starts with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">sk_live_...</code>)</li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>Go to <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-[var(--brand)] underline font-medium">Vercel → Your Project → Settings → Environment Variables</a></li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>Add a variable named <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">STRIPE_SECRET_KEY</code> with your key as the value</li>
          <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">5</span>Redeploy your site — the payments section will populate automatically</li>
        </ol>
      </div>
      <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-2 bg-[var(--brand)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
        Open Vercel Dashboard <ArrowUpRight className="w-4 h-4" />
      </a>
    </div>
  );
}

/* ─── Create Invoice Modal ────────────────────── */
function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', amount: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name || !form.email || !form.amount) { setError('Please fill in name, email and amount.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      onCreated();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-cb-surface border border-cb-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h3 className="font-bold text-cb-text">Create Invoice</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cb-bg transition-colors">
            <X className="w-4 h-4 text-cb-text-secondary" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide block mb-1.5">Client Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 text-sm bg-cb-bg border border-cb-border rounded-lg text-cb-text placeholder:text-cb-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide block mb-1.5">Email</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="jane@email.com" type="email"
                className="w-full px-3 py-2 text-sm bg-cb-bg border border-cb-border rounded-lg text-cb-text placeholder:text-cb-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide block mb-1.5">Amount (AUD)</label>
              <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="150.00" type="number" min="0" step="0.01"
                className="w-full px-3 py-2 text-sm bg-cb-bg border border-cb-border rounded-lg text-cb-text placeholder:text-cb-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide block mb-1.5">Due Date</label>
              <input value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                type="date"
                className="w-full px-3 py-2 text-sm bg-cb-bg border border-cb-border rounded-lg text-cb-text focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide block mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Monthly coaching package — April"
              className="w-full px-3 py-2 text-sm bg-cb-bg border border-cb-border rounded-lg text-cb-text placeholder:text-cb-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-cb-border text-sm font-medium text-cb-text hover:bg-cb-bg transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Creating…' : 'Create & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────── */
export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [noKey, setNoKey] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, pmRes, invRes, subRes] = await Promise.all([
        fetch('/api/stripe/overview'),
        fetch('/api/stripe/payments'),
        fetch('/api/stripe/invoices'),
        fetch('/api/stripe/subscriptions'),
      ]);
      const [ov, pm, inv, sub] = await Promise.all([ovRes.json(), pmRes.json(), invRes.json(), subRes.json()]);

      if (ov.error === 'no_key') { setNoKey(true); setLoading(false); return; }
      setNoKey(false);
      setOverview(ov);
      setPayments(pm.payments ?? []);
      setInvoices(inv.invoices ?? []);
      setSubscriptions(sub.subscriptions ?? []);
    } catch {
      setNoKey(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendInvoice = async (id: string) => {
    setSendingInvoice(id);
    await fetch(`/api/stripe/invoices?action=send&id=${id}`);
    setSendingInvoice(null);
    load();
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Zap className="w-4 h-4" /> },
  ];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--brand)]" />
    </div>
  );

  if (noKey) return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-cb-text mb-1">Payments</h1>
        <p className="text-cb-text-secondary text-sm mb-8">Stripe-powered billing &amp; invoicing</p>
        <NoKeyState />
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cb-text mb-1">Payments</h1>
            <p className="text-cb-text-secondary text-sm">Connected via Stripe</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-cb-border hover:bg-cb-bg transition-colors text-cb-text-secondary">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCreateInvoice(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--brand)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-cb-surface border border-cb-border rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-cb-text-secondary hover:text-cb-text hover:bg-cb-bg'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────── */}
        {tab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* This Month */}
              <div className="bg-cb-surface border border-cb-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide mb-3">This Month</p>
                <p className="text-2xl font-bold text-cb-text">{fmt(overview.thisMonthRevenue)}</p>
                {overview.monthChange !== null && (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${overview.monthChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {overview.monthChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(overview.monthChange).toFixed(1)}% vs last month
                  </div>
                )}
              </div>
              {/* Total Revenue */}
              <div className="bg-cb-surface border border-cb-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide mb-3">Total Revenue</p>
                <p className="text-2xl font-bold text-cb-text">{fmt(overview.totalRevenue)}</p>
                <p className="text-xs text-cb-text-secondary mt-2">Last 12 months</p>
              </div>
              {/* Outstanding */}
              <div className="bg-cb-surface border border-cb-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide mb-3">Outstanding</p>
                <p className="text-2xl font-bold text-cb-text">{fmt(overview.outstandingAmount)}</p>
                <p className="text-xs text-amber-500 mt-2 font-medium">{overview.outstandingCount} unpaid invoice{overview.outstandingCount !== 1 ? 's' : ''}</p>
              </div>
              {/* Active Subscriptions */}
              <div className="bg-cb-surface border border-cb-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-cb-text-secondary uppercase tracking-wide mb-3">Active Plans</p>
                <p className="text-2xl font-bold text-cb-text">{overview.activeSubscriptions}</p>
                <p className="text-xs text-cb-text-secondary mt-2">Recurring clients</p>
              </div>
            </div>

            {/* Recent payments preview */}
            <div className="bg-cb-surface border border-cb-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-cb-border flex items-center justify-between">
                <h3 className="font-semibold text-cb-text text-sm">Recent Payments</h3>
                <button onClick={() => setTab('payments')} className="text-xs text-[var(--brand)] font-medium hover:underline">View all</button>
              </div>
              <div className="divide-y divide-cb-border">
                {payments.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] text-xs font-bold">
                        {p.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cb-text">{p.customerName}</p>
                        <p className="text-xs text-cb-text-secondary">{format(new Date(p.date * 1000), 'd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                      <p className="text-sm font-bold text-cb-text">{fmt(p.amount, p.currency)}</p>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && <p className="px-5 py-8 text-center text-sm text-cb-text-secondary">No payments yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Payments ──────────────────────────── */}
        {tab === 'payments' && (
          <div className="bg-cb-surface border border-cb-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-cb-border">
              <h3 className="font-semibold text-cb-text text-sm">{payments.length} payments</h3>
            </div>
            <div className="divide-y divide-cb-border">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-cb-bg/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] text-sm font-bold flex-shrink-0">
                      {p.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cb-text truncate">{p.customerName}</p>
                      <p className="text-xs text-cb-text-secondary truncate">{p.description || p.customerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <p className="text-xs text-cb-text-secondary hidden sm:block">{format(new Date(p.date * 1000), 'd MMM yyyy')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                    <p className="text-sm font-bold text-cb-text w-24 text-right">{fmt(p.amount, p.currency)}</p>
                    {p.receiptUrl && (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-cb-bg transition-colors text-cb-text-secondary">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {payments.length === 0 && <p className="px-5 py-12 text-center text-sm text-cb-text-secondary">No payments found</p>}
            </div>
          </div>
        )}

        {/* ── Invoices ─────────────────────────── */}
        {tab === 'invoices' && (
          <div className="bg-cb-surface border border-cb-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-cb-border flex items-center justify-between">
              <h3 className="font-semibold text-cb-text text-sm">{invoices.length} invoices</h3>
              <button onClick={() => setShowCreateInvoice(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline">
                <Plus className="w-3.5 h-3.5" /> New Invoice
              </button>
            </div>
            <div className="divide-y divide-cb-border">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-cb-bg/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] text-sm font-bold flex-shrink-0">
                      {inv.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cb-text truncate">{inv.customerName}</p>
                      <p className="text-xs text-cb-text-secondary truncate">{inv.description || inv.number || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {inv.dueDate && (
                      <p className="text-xs text-cb-text-secondary hidden sm:block">
                        Due {format(new Date(inv.dueDate * 1000), 'd MMM')}
                      </p>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(inv.status)}`}>{statusLabel(inv.status)}</span>
                    <p className="text-sm font-bold text-cb-text w-24 text-right">{fmt(inv.amount, inv.currency)}</p>
                    <div className="flex items-center gap-1">
                      {inv.status === 'draft' && (
                        <button onClick={() => sendInvoice(inv.id)} disabled={sendingInvoice === inv.id}
                          className="p-1.5 rounded-lg hover:bg-cb-bg transition-colors text-[var(--brand)] disabled:opacity-40"
                          title="Send invoice">
                          {sendingInvoice === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {inv.hostedUrl && (
                        <a href={inv.hostedUrl} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-cb-bg transition-colors text-cb-text-secondary" title="View invoice">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p className="px-5 py-12 text-center text-sm text-cb-text-secondary">No invoices yet — create your first one above</p>}
            </div>
          </div>
        )}

        {/* ── Subscriptions ────────────────────── */}
        {tab === 'subscriptions' && (
          <div className="bg-cb-surface border border-cb-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-cb-border">
              <h3 className="font-semibold text-cb-text text-sm">{subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</h3>
            </div>
            <div className="divide-y divide-cb-border">
              {subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between px-5 py-4 hover:bg-cb-bg/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] text-sm font-bold flex-shrink-0">
                      {sub.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cb-text truncate">{sub.customerName}</p>
                      <p className="text-xs text-cb-text-secondary truncate">{sub.plan} · {fmt(sub.amount, sub.currency)}/{sub.interval}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <p className="text-xs text-cb-text-secondary hidden sm:block">
                      Renews {format(new Date(sub.currentPeriodEnd * 1000), 'd MMM yyyy')}
                    </p>
                    {sub.cancelAtPeriodEnd && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400">Cancelling</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(sub.status)}`}>{statusLabel(sub.status)}</span>
                    <p className="text-sm font-bold text-cb-text w-24 text-right">{fmt(sub.amount, sub.currency)}</p>
                  </div>
                </div>
              ))}
              {subscriptions.length === 0 && <p className="px-5 py-12 text-center text-sm text-cb-text-secondary">No active subscriptions</p>}
            </div>
          </div>
        )}
      </div>

      {showCreateInvoice && (
        <CreateInvoiceModal onClose={() => setShowCreateInvoice(false)} onCreated={load} />
      )}
    </div>
  );
}
