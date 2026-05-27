import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Large Dumbbells | Kyle Briere — Fitness Coaching for Busy Professionals',
  description:
    '12-week fully customized fitness & nutrition coaching built around your 50+ hour work week. Guaranteed results or your money back. Apply for a spot with Kyle today.',
  keywords: ['fitness coach', 'online coaching', 'busy professional', 'weight loss', 'muscle building', 'nutrition coaching'],
  openGraph: {
    title: 'Large Dumbbells | Helping Busy People Build Their Dream Bodies',
    description: '12 weeks. Fully Customized. Built around a 50+ hour work week. Guaranteed Results.',
    url: 'https://largedumbbells.com',
    siteName: 'Large Dumbbells',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
