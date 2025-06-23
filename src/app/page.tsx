'use client';

import * as React from 'react';
import Header from '@/components/header';
import { ClientDashboard } from '@/components/client-dashboard';
import { FreelancerDashboard } from '@/components/freelancer-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, User } from 'lucide-react';
import { mockJobs, mockUsers } from '@/lib/mock-data';

export default function ShaqoFinderApp() {
  // In a real app, user data would come from an auth context
  const clientUser = mockUsers.find((u) => u.role === 'client')!;
  const freelancerUser = mockUsers.find((u) => u.role === 'freelancer')!;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mx-auto">
            <TabsTrigger value="client">
              <User className="mr-2 h-4 w-4" />
              Client View
            </TabsTrigger>
            <TabsTrigger value="freelancer">
              <Briefcase className="mr-2 h-4 w-4" />
              Freelancer View
            </TabsTrigger>
          </TabsList>
          <TabsContent value="client" className="mt-6">
            <ClientDashboard user={clientUser} jobs={mockJobs} />
          </TabsContent>
          <TabsContent value="freelancer" className="mt-6">
            <FreelancerDashboard user={freelancerUser} jobs={mockJobs} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
