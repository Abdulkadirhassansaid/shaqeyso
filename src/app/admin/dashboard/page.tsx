
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { AdminDashboard } from '@/components/admin-dashboard';
import { JobsProvider } from '@/hooks/use-jobs';
import { MessagesProvider } from '@/hooks/use-messages';
import { ProposalsProvider } from '@/hooks/use-proposals';
import { ReviewsProvider } from '@/hooks/use-reviews';
import { DirectMessagesProvider } from '@/hooks/use-direct-messages';
import { UsersProvider } from '@/hooks/use-users';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) {
      return; // Wait for the auth state to load
    }
    if (!user) {
      router.replace('/admin/login'); // Not logged in, go to admin login
    } else if (user.role !== 'admin') {
      router.replace('/'); // Logged in but not admin, go to home
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return null;
  }

  // If we reach here, user is an admin
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <UsersProvider>
          <JobsProvider>
            <MessagesProvider>
              <ProposalsProvider>
                <ReviewsProvider>
                  <DirectMessagesProvider>
                    <AdminDashboard />
                  </DirectMessagesProvider>
                </ReviewsProvider>
              </ProposalsProvider>
            </MessagesProvider>
          </JobsProvider>
        </UsersProvider>
      </main>
    </div>
  );
}
