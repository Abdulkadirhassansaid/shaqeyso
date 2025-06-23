
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { ClientDashboard } from '@/components/client-dashboard';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { JobsProvider } from '@/hooks/use-jobs';
import { ProposalsProvider } from '@/hooks/use-proposals';
import { MessagesProvider } from '@/hooks/use-messages';
import { ReviewsProvider } from '@/hooks/use-reviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShaqeysoHubApp() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
    } else if (!user.isVerified && user.role !== 'admin') {
      router.replace('/verify');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || (!user.isVerified && user.role !== 'admin')) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <JobsProvider key={`jobs-${user.id}`}>
          <ProposalsProvider key={`proposals-${user.id}`}>
            <MessagesProvider key={`messages-${user.id}`}>
              <ReviewsProvider>
                {user.role === 'client' && <ClientDashboard user={user} />}
                {user.role === 'freelancer' && <FreelancerDashboard user={user} />}
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
              </ReviewsProvider>
            </MessagesProvider>
          </ProposalsProvider>
        </JobsProvider>
      </main>
    </div>
  );
}
