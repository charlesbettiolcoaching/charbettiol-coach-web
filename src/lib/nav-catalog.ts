/**
 * Shared navigation catalog used by both the Sidebar and the Command Palette.
 * Kept in one place so a new page is visible in both surfaces automatically.
 *
 * Each page can also expose **keywords** — synonyms / goals the coach might
 * type into the command palette that aren't in the label itself.
 */

import {
  LayoutDashboard, Users, Dumbbell, UtensilsCrossed, Settings, Bell,
  MessageSquare, ClipboardCheck, BookOpen, ListTodo, CreditCard, Mail,
  Gift, Shield, Megaphone, Video, MessageSquareText, Tag, Film, Star,
  ShoppingBag, Palette, Package, UsersRound, CalendarClock, Bot,
  BrainCircuit, AlertTriangle, Sparkles, Home, KeyRound,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<any>
  /** Extra terms the command palette should match on. */
  keywords?: string[]
  /** Mark this route as AI-native — the UI highlights it with a subtle glow. */
  ai?: boolean
}

export interface NavSection {
  /** Undefined for the root group (Dashboard). */
  label?: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: ['home', 'overview'] },
    ],
  },
  {
    label: 'AI COACH',
    items: [
      { href: '/ai-coach',     label: 'Mission Control', icon: Sparkles,     keywords: ['ai', 'overview', 'briefing', 'today', 'priorities'], ai: true },
      { href: '/ai-reviews',   label: 'AI Reviews',      icon: Bot,          keywords: ['check-in reviews', 'adjustments', 'audit'], ai: true },
      { href: '/intelligence', label: 'Intelligence',    icon: BrainCircuit, keywords: ['risk', 'churn', 'signals', 'insights', 'at risk'], ai: true },
      { href: '/concerns',     label: 'Safety Concerns', icon: AlertTriangle, keywords: ['flags', 'safety', 'escalations', 'disordered', 'self-harm'], ai: true },
    ],
  },
  {
    label: 'CLIENTS',
    items: [
      { href: '/clients',    label: 'Clients',     icon: Users,          keywords: ['roster', 'members', 'people'] },
      { href: '/messages',   label: 'Messages',    icon: MessageSquare,  keywords: ['chat', 'dm', 'conversations'] },
      { href: '/check-ins',  label: 'Check-ins',   icon: ClipboardCheck, keywords: ['weekly', 'submissions'] },
      { href: '/groups',     label: 'Group Chats', icon: UsersRound,     keywords: ['groups', 'channels'] },
    ],
  },
  {
    label: 'PROGRAMS & NUTRITION',
    items: [
      { href: '/programs',  label: 'Programs',  icon: Dumbbell,       keywords: ['training', 'workout', 'plan'] },
      { href: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed, keywords: ['meal plan', 'food', 'diet', 'macros'] },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { href: '/tasks',         label: 'Tasks',         icon: ListTodo,          keywords: ['todo', 'reminders'] },
      { href: '/form-check',    label: 'Form Check',    icon: Video,             keywords: ['technique', 'video review'] },
      { href: '/templates',     label: 'Templates',     icon: MessageSquareText, keywords: ['canned responses'] },
      { href: '/video-library', label: 'Video Library', icon: Film,              keywords: ['recordings', 'clips'] },
      { href: '/habits',        label: 'Habits',        icon: CalendarClock,     keywords: ['streaks', 'daily'] },
      { href: '/resources',     label: 'Resources',     icon: BookOpen,          keywords: ['docs', 'pdfs'] },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { href: '/reviews',      label: 'Reviews',      icon: Star,        keywords: ['testimonials', 'feedback'] },
      { href: '/marketplace',  label: 'Marketplace',  icon: ShoppingBag, keywords: ['shop', 'listings'] },
      { href: '/packages',     label: 'Packages',     icon: Package,     keywords: ['pricing', 'plans'] },
      { href: '/referrals',    label: 'Referrals',    icon: Gift,        keywords: ['referral codes', 'invites'] },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { href: '/payments',                 label: 'Payments',        icon: CreditCard, keywords: ['stripe', 'invoices', 'billing'] },
      { href: '/email-sequences',          label: 'Email Sequences', icon: Mail,       keywords: ['autoresponder'] },
      { href: '/notifications',            label: 'Notifications',   icon: Bell,       keywords: ['inbox'] },
      { href: '/notifications-broadcast',  label: 'Broadcasts',      icon: Megaphone,  keywords: ['announce', 'push'] },
      { href: '/team',                     label: 'Team',            icon: Users,      keywords: ['assistants', 'staff'] },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { href: '/branding',  label: 'Branding',        icon: Palette,  keywords: ['logo', 'colors', 'theme'] },
      { href: '/tags',      label: 'Tags & Segments', icon: Tag,      keywords: ['labels', 'segments'] },
      { href: '/api-keys',  label: 'API keys',        icon: KeyRound, keywords: ['api', 'integrations', 'tokens', 'zapier'] },
      { href: '/settings',  label: 'Settings',        icon: Settings, keywords: ['account', 'profile'] },
      { href: '/privacy',   label: 'Privacy & Data',  icon: Shield,   keywords: ['gdpr', 'data'] },
    ],
  },
]

/** Flattened list — useful for fuzzy search. */
export const NAV_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

/** AI-specific quick actions shown at the top of the command palette. */
export interface QuickAction {
  id: string
  label: string
  hint: string
  /** Route to navigate to on Enter. */
  href?: string
  /** Or a canned AI question to send to /api/ai-coach/ask. */
  query?: string
  icon: React.ComponentType<any>
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'today',       label: "Today's briefing",          hint: 'Your AI-generated priorities for today', href: '/ai-coach',    icon: Sparkles },
  { id: 'at-risk',     label: 'Who is at risk?',           hint: 'Clients flagged for churn',             href: '/intelligence', icon: BrainCircuit },
  { id: 'safety',      label: 'Any safety concerns?',      hint: 'Open safety flags',                     href: '/concerns',     icon: AlertTriangle },
  { id: 'gone-quiet',  label: 'Who has gone quiet?',       hint: 'No message in 14+ days',                query: 'Which clients have not messaged me in the last 14 days?', icon: MessageSquare },
  { id: 'needs-deload',label: 'Who needs a deload?',       hint: 'High fatigue signals',                  query: 'Which clients are showing fatigue signals strong enough to warrant a deload?', icon: Dumbbell },
  { id: 'celebrate',   label: 'Who hit a milestone?',      hint: 'PRs, streaks, goals reached',           query: 'Which clients reached a notable milestone this week (PRs, streaks, goal weight)?', icon: Star },
]
