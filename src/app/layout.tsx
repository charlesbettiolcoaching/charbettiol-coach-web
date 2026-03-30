import type { Metadata } from 'next'
import { Inter, Figtree } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ChatbotWrapper from '@/components/ChatbotWrapper'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://propelcoaches.com'),
  title: {
    default: 'Propel Coaches — The All-in-One Coaching Platform',
    template: '%s | Propel Coaches',
  },
  description:
    'The all-in-one coaching platform for personal trainers, nutritionists, and fitness coaches. Manage clients, programs, nutrition, and payments in one place.',
  keywords: [
    'coaching platform',
    'personal trainer software',
    'fitness coaching app',
    'nutrition coaching',
    'client management',
    'workout programming',
    'online coaching',
    'PT software',
    'check-in app',
  ],
  authors: [{ name: 'Propel Coaches' }],
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://propelcoaches.com',
    siteName: 'Propel Coaches',
    title: 'Propel Coaches — The All-in-One Coaching Platform',
    description:
      'Manage clients, programs, nutrition, and payments. Built for personal trainers, nutritionists, and fitness coaches.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Propel Coaches Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Propel Coaches — The All-in-One Coaching Platform',
    description:
      'The all-in-one platform for fitness coaches. Manage clients, programs, nutrition, and payments.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${figtree.variable} font-sans`}>
        <ThemeProvider>
          {children}
          <ChatbotWrapper />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
