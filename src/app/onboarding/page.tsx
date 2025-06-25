
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function OnboardingPage() {
  const { isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // This page is now a legacy redirector.
    // All onboarding logic is handled on the main page.
    if (!isLoading) {
        router.replace('/');
    }
  }, [isLoading, router]);

  // Render a skeleton/loader while waiting for auth state or during redirect
  return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* You can add a skeleton loader here */}
      </div>
  );
}
