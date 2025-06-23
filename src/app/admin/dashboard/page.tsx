
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboard } from '@/components/admin-dashboard';
import { useLanguage } from '@/hooks/use-language';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
