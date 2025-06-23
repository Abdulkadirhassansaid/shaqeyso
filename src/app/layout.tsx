import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/hooks/use-language';
import { ThemeProvider } from '@/hooks/use-theme';
import { DirectMessagesProvider } from '@/hooks/use-direct-messages';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Shaqeyso Hub',
  description: 'A freelancer marketplace for Somali users.',
};

function MissingFirebaseConfig() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg rounded-lg border border-destructive bg-card p-6 text-center text-card-foreground">
            <h1 className="text-2xl font-bold text-destructive">Firebase Configuration Missing</h1>
            <p className="mt-2 text-muted-foreground">
                Your Firebase project credentials are not set up correctly.
            </p>
            <p className="mt-4 text-sm">
                Please add your Firebase configuration to the <code className="bg-muted px-1 py-0.5 rounded-sm">.env</code> file at the root of your project and then <strong>restart the development server</strong>.
            </p>
            <pre className="mt-4 rounded-md bg-muted p-4 text-left text-xs overflow-x-auto">
                {`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...`}
            </pre>
        </div>
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <MissingFirebaseConfig />
            </body>
        </html>
    )
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
