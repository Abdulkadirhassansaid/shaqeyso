'use client';

import { useLoading } from '@/hooks/use-loading';
import { LoadingSpinner } from './loading-spinner';

export function PageLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  );
}
