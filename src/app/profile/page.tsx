
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ClientProfilePage } from '@/components/client-profile-page';
import { FreelancerProfilePage } from '@/components/freelancer-profile-page';
import { AdminProfilePage } from '@/components/admin-profile-page';
import { ReviewsProvider } from '@/hooks/use-reviews';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ReviewsProvider>
          {user.role === 'client' && <ClientProfilePage user={user} />}
          {user.role === 'freelancer' && <FreelancerProfilePage user={user} />}
          {user.role === 'admin' && <AdminProfilePage user={user} />}
        </ReviewsProvider>
      </main>
    </div>
  );
}
