
'use client';

import * as React from 'react';
import Header from '@/components/header';
import { AdminDashboard } from '@/components/admin-dashboard';

export default function AdminPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
