
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { ClientDashboard } from '@/components/client-dashboard';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoading } from '@/hooks/use-loading';

export default function ShaqeysoHubApp() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { setIsLoading: setPageIsLoading } = useLoading();

  React.useEffect(() => {
    // Don't do anything until the auth state is fully resolved.
    if (isLoading) {
      return;
    }

    // Redirect users who are not logged in or are unverified.
    if (!user) {
      setPageIsLoading(true);
      router.replace('/login');
    } else if (user.role !== 'admin' && user.verificationStatus === 'unverified') {
      setPageIsLoading(true);
      router.replace('/onboarding');
    }
  }, [isLoading, user, router, setPageIsLoading]);

  // While loading auth state OR if there's no user (and we are about to redirect), show nothing.
  if (isLoading || !user) {
    return null;
  }

  // If we reach here, we know we have a user.
  // If they are unverified, they will be redirected by the useEffect.
  // This check prevents a "flash" of the dashboard for unverified users before the redirect completes.
  if (user.role !== 'admin' && user.verificationStatus === 'unverified') {
    return null;
  }
  
  // At this point, we have a valid, logged-in user who is either an admin, or verified, or pending/rejected.
  // All these states are allowed to see their dashboard.
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
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
