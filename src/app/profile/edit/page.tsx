'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { ClientProfilePage } from '@/components/client-profile-page';
import { FreelancerProfilePage } from '@/components/freelancer-profile-page';
import { AdminProfilePage } from '@/components/admin-profile-page';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { ReviewsProvider } from '@/hooks/use-reviews';

export default function ProfileEditPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

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
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <Button asChild variant="outline" size="sm">
                <Link href="/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.profile}
                </Link>
            </Button>
        </div>
        <ReviewsProvider>
          {user.role === 'client' && <ClientProfilePage user={user} />}
          {user.role === 'freelancer' && <FreelancerProfilePage user={user} />}
          {user.role === 'admin' && <AdminProfilePage user={user} />}
        </ReviewsProvider>
      </main>
    </div>
  );
}
