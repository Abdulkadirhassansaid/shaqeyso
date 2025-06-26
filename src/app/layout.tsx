
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/hooks/use-language';
import { ThemeProvider } from '@/hooks/use-theme';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { LoadingProvider } from '@/hooks/use-loading';
import { PageLoader } from '@/components/page-loader';
import { PageProgress } from '@/components/page-progress';
import { UsersProvider } from '@/hooks/use-users';
import { JobsProvider } from '@/hooks/use-jobs';
import { ProposalsProvider } from '@/hooks/use-proposals';
import { NotificationHandler } from '@/components/notification-handler';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Shaqeyso Hub',
  description: 'A freelancer marketplace for Somali users.',
  icons: {
    icon: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  },
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
      <body
        className={cn(
          'min-h-screen bg-muted font-body antialiased',
          inter.variable
        )}
      >
        <ThemeProvider>
          <LanguageProvider>
            <LoadingProvider>
              <AuthProvider>
                <UsersProvider>
                  <JobsProvider>
                    <ProposalsProvider>
                      <NotificationHandler />
                      <PageProgress />
                      <PageLoader />
                      <div className="relative flex min-h-screen flex-col">
                        <main className="flex-1 pb-20 md:pb-0">{children}</main>
                        <BottomNav />
                      </div>
                      <Toaster />
                    </ProposalsProvider>
                  </JobsProvider>
                </UsersProvider>
              </AuthProvider>
            </LoadingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
