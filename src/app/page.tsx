'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { ClientDashboard } from '@/components/client-dashboard';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { JobsProvider } from '@/hooks/use-jobs';
import { ProposalsProvider } from '@/hooks/use-proposals';

export default function ShaqeysoHubApp() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
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
        <JobsProvider>
          <ProposalsProvider>
            {user.role === 'client' && <ClientDashboard user={user} />}
            {user.role === 'freelancer' && <FreelancerDashboard user={user} />}
          </ProposalsProvider>
        </JobsProvider>
      </main>
    </div>
  );
}
