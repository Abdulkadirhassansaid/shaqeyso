
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { ClientDashboard } from '@/components/client-dashboard';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLoading } from '@/hooks/use-loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';


export default function ShaqeysoHubApp() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { setIsLoading: setPageIsLoading } = useLoading();
  const { t } = useLanguage();

  React.useEffect(() => {
    // Don't do anything until the auth state is fully resolved.
    if (isLoading) {
      return;
    }

    // Only redirect users who are not logged in.
    if (!user) {
      setPageIsLoading(true);
      router.replace('/login');
    }
  }, [isLoading, user, router, setPageIsLoading]);

  // While loading auth state OR if there's no user (and we are about to redirect), show nothing.
  if (isLoading || !user) {
    return null;
  }
  
  // Handle users who are not yet verified
  if (user.role !== 'admin' && (user.verificationStatus === 'unverified' || user.verificationStatus === 'rejected')) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>{user.verificationStatus === 'rejected' ? t.verificationRejectedTitle : t.welcomeToPlatform.replace('{name}', user.name)}</CardTitle>
                    <CardDescription>
                        {user.verificationStatus === 'rejected' ? t.verificationRejectedDesc : t.onboardingDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {user.verificationStatus === 'rejected' && user.verificationRejectionReason && (
                      <Alert variant="destructive" className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Rejection Reason</AlertTitle>
                          <AlertDescription>
                              {user.verificationRejectionReason}
                          </AlertDescription>
                      </Alert>
                  )}
                   {user.verificationStatus === 'unverified' && (
                     <p className="text-sm text-muted-foreground">{t.onboardingNextStep}</p>
                   )}
                </CardContent>
                <CardFooter>
                    <Button asChild>
                        <Link href="/verify">{t.startVerification}</Link>
                    </Button>
                </CardFooter>
            </Card>
        </main>
      </div>
    );
  }
  
  // Show dashboard for verified, pending, and admin users
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
        {user.verificationStatus === 'pending' && user.role !== 'admin' && (
             <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertTitle>{t.verificationPendingTitle}</AlertTitle>
              <AlertDescription>{t.verificationPendingDesc}</AlertDescription>
            </Alert>
        )}
        {user.role === 'client' && <ClientDashboard />}
        {user.role === 'freelancer' && <FreelancerDashboard />}
        {user.role === 'admin' && (
          <Card className="max-w-md mx-auto mt-10">
            <CardHeader className="text-center">
              <CardTitle>Welcome, Admin!</CardTitle>
              <CardDescription>You have logged in to the user dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">Your administrative tools are in a separate dashboard.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/dashboard">Go to Admin Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
