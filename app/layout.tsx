import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '../components/ui/toaster';
import { ThemeProvider } from '../components/ThemeProvider';
import { TooltipProvider } from '../components/ui/tooltip';
import DotsOnDa from '@/components/ui/dotsdonda';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bimus | Arquitectura y Construcción',
  description: 'Gestión integral de proyectos de arquitectura y construcción.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pub-0c4e991892914662ba0e3f09fb79757a.r2.dev" />
        <link rel="preconnect" href="https://pub-c09b07f1a7954c46b7f2a640146d8703.r2.dev" />
      </head>
      <body className={`${inter.className} font-body antialiased min-h-screen bg-background text-foreground`}>
        <div className="h-full w-full fixed">
          <DotsOnDa />
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <main className="flex-1 min-h-screen">
              <div className="relative w-100vh h-100vh">
                <div className="relative">
                  {children}
                </div>
              </div>
            </main>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}