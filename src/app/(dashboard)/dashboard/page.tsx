'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  MessageSquare,
  ClipboardCheck,
  Dumbbell,
  CreditCard,
  ArrowUpRight,
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  Loader,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  unreadMessages: number;
  pendingCheckins: number;
  activePrograms: number;
  openConcerns: number;
  currency: string;
}

interface RecentActivity {
  id: string;
  type: 'client_joined' | 'payment' | 'checkin' | 'message';
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const supabase = createClientComponentClient();

  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    unreadMessages: 0,
    pendingCheckins: 0,
    activePrograms: 0,
    openConcerns: 0,
    currency: 'AUD',
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [coachName, setCoachName] = useState('Coach');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get coach profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setCoachName(profile.full_name.split(' ')[0]);
      }

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, status, created_at')
        .eq('role', 'client')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      const clients = clientsData || [];
      const activeClients = clients.filter((c: any) => c.status === 'active');

      setRecentClients(clients.slice(0, 5));

      // Fetch revenue (gracefully handle missing table)
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let currency = 'AUD';

      try {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount_cents, currency, status, created_at')
          .eq('coach_id', user.id)
          .eq('status', 'succeeded');

        if (payments && payments.length > 0) {
          totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount_cents, 0);
          currency = payments[0].currency || 'AUD';

          const now = new Date();
          monthlyRevenue = payments
            .filter((p: any) => {
              const d = new Date(p.created_at);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((sum: number, p: any) => sum + p.amount_cents, 0);
        }
      } catch {
        // Payments table may not exist
      }

      // Fetch unread messages count
      let unreadMessages = 0;
      try {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false);
        unreadMessages = count || 0;
      } catch {
        // Messages table may not exist
      }

      // Fetch pending check-ins
      let pendingCheckins = 0;
      try {
        const { count } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', user.id)
          .eq('reviewed', false);
        pendingCheckins = count || 0;
      } catch {
        // Check-ins table may not exist
      }

      // Fetch open AI safety concerns
      let openConcerns = 0;
      try {
        const { count } = await supabase
          .from('ai_coach_concerns')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open');
        openConcerns = count || 0;
      } catch {
        // Table may not exist yet
      }

      setStats({
        totalClients: clients.length,
        activeClients: activeClients.length,
        totalRevenue,
        monthlyRevenue,
        unreadMessages,
        pendingCheckins,
        activePrograms: 0,
        openConcerns,
        currency,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const formatCurrency = (cents: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="text-red-400" size={48} />
        <p className="text-cb-secondary">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cb-text">{greeting}, {coachName}</h1>
        <p className="text-cb-secondary text-sm mt-1">Here&apos;s what&apos;s happening with your coaching business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/clients" className="bg-card rounded-xl border border-cb-border p-5 hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Users size={18} className="text-brand" />
            </div>
            <span className="text-sm text-cb-secondary">Total Clients</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-cb-text">{stats.totalClients}</p>
            <span className="text-xs text-green-400">{stats.activeClients} active</span>
          </div>
        </Link>

        <Link href="/payments" className="bg-card rounded-xl border border-cb-border p-5 hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp size={18} className="text-green-400" />
            </div>
            <span className="text-sm text-cb-secondary">Monthly Revenue</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-cb-text">{formatCurrency(stats.monthlyRevenue, stats.currency)}</p>
            <ArrowUpRight size={16} className="text-cb-muted group-hover:text-brand transition-colors" />
          </div>
        </Link>

        <Link href="/messages" className="bg-card rounded-xl border border-cb-border p-5 hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <MessageSquare size={18} className="text-purple-400" />
            </div>
            <span className="text-sm text-cb-secondary">Unread Messages</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-cb-text">{stats.unreadMessages}</p>
            {stats.unreadMessages > 0 && (
              <span className="text-xs text-purple-400 font-medium">Needs attention</span>
            )}
          </div>
        </Link>

        <Link href="/check-ins" className="bg-card rounded-xl border border-cb-border p-5 hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <ClipboardCheck size={18} className="text-amber-400" />
            </div>
            <span className="text-sm text-cb-secondary">Pending Check-ins</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-cb-text">{stats.pendingCheckins}</p>
            {stats.pendingCheckins > 0 && (
              <span className="text-xs text-amber-400 font-medium">To review</span>
            )}
          </div>
        </Link>

        <Link href="/concerns" className="bg-card rounded-xl border border-cb-border p-5 hover:border-brand/30 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <span className="text-sm text-cb-secondary">Open Concerns</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-cb-text">{stats.openConcerns}</p>
            {stats.openConcerns > 0 && (
              <span className="text-xs text-red-400 font-medium">Needs review</span>
            )}
          </div>
        </Link>
      </div>

      {/* Quick Actions + Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-cb-border p-5">
          <h2 className="text-sm font-semibold text-cb-muted uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/clients"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors text-sm text-cb-text"
            >
              <Users size={16} className="text-brand" />
              Add New Client
            </Link>
            <Link
              href="/workout-programs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors text-sm text-cb-text"
            >
              <Dumbbell size={16} className="text-brand" />
              Create Workout Program
            </Link>
            <Link
              href="/meal-plans"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors text-sm text-cb-text"
            >
              <Activity size={16} className="text-brand" />
              Generate Meal Plan
            </Link>
            <Link
              href="/packages"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors text-sm text-cb-text"
            >
              <CreditCard size={16} className="text-brand" />
              Manage Packages
            </Link>
          </div>
        </div>

        {/* Recent Clients */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-cb-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-cb-muted uppercase tracking-wider">Recent Clients</h2>
            <Link href="/clients" className="text-xs text-brand hover:text-brand/80 transition-colors">
              View all
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-cb-muted mb-3" size={32} />
              <p className="text-sm text-cb-secondary">No clients yet</p>
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-brand text-white text-sm rounded-lg hover:bg-brand/90 transition-colors"
              >
                Add Your First Client
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light transition-colors"
                >
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand">{getInitials(client.full_name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cb-text truncate">{client.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-cb-muted truncate">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Clock size={10} /> {client.status || 'Invited'}
                      </span>
                    )}
                    <span className="text-xs text-cb-muted">
                      {new Date(client.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
