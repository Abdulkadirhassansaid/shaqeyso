
import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/hooks/use-language';
import { ThemeProvider } from '@/hooks/use-theme';
import { DirectMessagesProvider } from '@/hooks/use-direct-messages';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PageProgress } from '@/components/page-progress';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Shaqeyso Hub',
  description: 'A freelancer marketplace for Somali users.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  if (!isFirebaseConfigured) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-body antialiased">
            <div className="flex min-h-screen items-center justify-center p-4">
               <Alert variant="destructive" className="max-w-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Firebase Not Configured</AlertTitle>
                  <AlertDescription>
                    Your Firebase environment variables are missing. Please copy the
                    configuration from your Firebase project settings into the{' '}
                    <code>.env</code> file in the root of your project and restart the server. The application will not work correctly until this is done.
                  </AlertDescription>
                </Alert>
            </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          ptSans.variable
        )}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DirectMessagesProvider>
                <PageProgress />
                {children}
                <Toaster />
              </DirectMessagesProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
