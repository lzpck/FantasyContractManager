import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { AuthNavigation } from '@/components/layout/AuthNavigation';
import { ThemeProvider } from 'next-themes';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppProvider>
            {/* Barra de navegação principal */}
            <nav className="bg-background shadow-sm border-b border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-foreground">Fantasy Contract Manager</h1>
                  </div>
                  <div className="flex items-center">
                    <AuthNavigation />
                  </div>
                </div>
              </div>
            </nav>

            {/* Conteúdo principal */}
            <main>{children}</main>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
