import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help & Support',
  description:
    'Get help with Propel Coaches. FAQs, tutorials, and support for personal trainers and fitness coaches.',
  alternates: {
    canonical: '/help',
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
