
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientVerificationForm } from '@/components/client-verification-form';
import { FreelancerVerificationForm } from '@/components/freelancer-verification-form';
import Header from '@/components/header';
import { useLanguage } from '@/hooks/use-language';

export default function VerifyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isLoading && user?.isVerified) {
      router.replace('/');
    }
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.isVerified) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        {user.role === 'client' ? (
          <ClientVerificationForm user={user} />
        ) : (
          <FreelancerVerificationForm user={user} />
        )}
      </main>
    </div>
  );
}
