
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
import { ReviewsProvider } from '@/hooks/use-reviews';


export default function ShaqeysoHubApp() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { setIsLoading: setPageIsLoading } = useLoading();
  const { t } = useLanguage();

  React.useEffect(() => {
    // This effect should only handle redirecting logged-out users.
    if (!isLoading && !user) {
      setPageIsLoading(true);
      router.replace('/login');
    }
  }, [isLoading, user, router, setPageIsLoading]);

  // While loading auth state OR if there's no user (and we are about to redirect), show nothing.
  if (isLoading || !user) {
    return null;
  }
  
  // Show dashboard for all logged-in users, with conditional alerts based on verification status.
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
        
        {user.role !== 'admin' && (user.verificationStatus === 'unverified' || user.verificationStatus === 'rejected') && (
            <Alert variant={user.verificationStatus === 'rejected' ? "destructive" : "default"} className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                    {user.verificationStatus === 'rejected' ? t.verificationRejectedTitle : t.verificationRequiredTitle}
                </AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <p>{user.verificationStatus === 'rejected' ? t.verificationRejectedDesc : (user.role === 'client' ? t.verificationRequiredClientDesc : t.verificationRequiredFreelancerDesc)}</p>
                    {user.verificationStatus === 'rejected' && user.verificationRejectionReason && (
                        <p className="font-semibold mt-2">{t.reasoning}: {user.verificationRejectionReason}</p>
                    )}
                  </div>
                  <Button asChild className="ml-auto shrink-0">
                      <Link href="/verify">{t.startVerification}</Link>
                  </Button>
                </AlertDescription>
            </Alert>
        )}

        {user.verificationStatus === 'pending' && user.role !== 'admin' && (
             <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertTitle>{t.verificationPendingTitle}</AlertTitle>
              <AlertDescription>{t.verificationPendingDesc}</AlertDescription>
            </Alert>
        )}
        
        <ReviewsProvider>
          {user.role === 'client' && <ClientDashboard />}
          {user.role === 'freelancer' && <FreelancerDashboard />}
        </ReviewsProvider>
        
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
