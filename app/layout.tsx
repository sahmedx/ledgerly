import type { Metadata } from 'next';
import { Caveat, Architects_Daughter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['500', '700'],
});

const architectsDaughter = Architects_Daughter({
  variable: '--font-architects-daughter',
  subsets: ['latin'],
  weight: '400',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Ledgerly — FP&A Budget Tool',
  description: 'Vendor expense forecasting for FP&A teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${architectsDaughter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
