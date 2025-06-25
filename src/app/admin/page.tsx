
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

// This page acts as a gatekeeper for the /admin route.
// It redirects to the appropriate page based on auth status.
export default function AdminRootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) {
      return; // Wait for auth state to load
    }
    if (user && user.role === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [user, isLoading, router]);

  // Render nothing while redirecting, or a loading skeleton.
  return null;
}
