import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { SessionWrapper } from '@/components/providers/SessionWrapper';
import { SWRProvider } from '@/components/providers/SWRProvider';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fantasy Contract Manager',
  description: 'Sistema de gerenciamento de contratos e salary cap para ligas de fantasy football',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f172a] min-h-screen`}
      >
        <SessionWrapper>
          <SWRProvider>
            <AppProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </AppProvider>
          </SWRProvider>
        </SessionWrapper>

        {/* Toaster para notificações */}
        <Toaster position="top-right" richColors closeButton duration={4000} theme="dark" />
      </body>
    </html>
  );
}
