import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { AuthNavigation } from '@/components/layout/AuthNavigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionWrapper } from '@/components/providers/SessionWrapper';
import { Toaster } from 'sonner';
import { Metadata } from 'next';

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f172a] min-h-screen`}
      >
        <SessionWrapper>
          <AppProvider>
            {/* Sidebar de navegação */}
            <Sidebar />

            {/* Layout principal com sidebar */}
            <div className="lg:pl-64">
              {/* Barra de navegação superior */}
              <nav className="bg-slate-900 shadow-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center lg:hidden">
                      <h1 className="text-xl font-bold text-slate-100">Fantasy Contract Manager</h1>
                    </div>
                    <div className="flex items-center ml-auto">
                      <AuthNavigation />
                    </div>
                  </div>
                </div>
              </nav>

              {/* Conteúdo principal */}
              <main className="bg-[#0f172a] min-h-screen">{children}</main>
            </div>
          </AppProvider>
         </SessionWrapper>
         
         {/* Toaster para notificações */}
         <Toaster 
           position="top-right"
           richColors
           closeButton
           duration={4000}
           theme="dark"
         />
      </body>
    </html>
  );
}
