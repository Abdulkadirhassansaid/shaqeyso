'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { ClientDashboard } from '@/components/client-dashboard';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { mockJobs } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShaqoFinderApp() {
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
        {user.role === 'client' && <ClientDashboard user={user} jobs={mockJobs} />}
        {user.role === 'freelancer' && <FreelancerDashboard user={user} jobs={mockJobs} />}
      </main>
    </div>
  );
}
