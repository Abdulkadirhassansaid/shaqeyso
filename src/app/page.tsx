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
  const { setIsLoading } = useLoading();

  React.useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      setIsLoading(true);
      router.replace('/login');
      return;
    }
    
    if (user.role !== 'admin' && user.verificationStatus === 'unverified') {
        setIsLoading(true);
        router.replace('/onboarding');
        return;
    }

  }, [isLoading, user, router, setIsLoading]);

  if (isLoading || !user || (user.role !== 'admin' && user.verificationStatus === 'unverified')) {
    return null;
  }

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
