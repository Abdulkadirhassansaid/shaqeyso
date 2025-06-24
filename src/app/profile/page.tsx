
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientProfilePage } from '@/components/client-profile-page';
import { FreelancerProfilePage } from '@/components/freelancer-profile-page';
import { AdminProfilePage } from '@/components/admin-profile-page';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Settings, CreditCard, LogOut, ShieldQuestion } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { ReviewsProvider } from '@/hooks/use-reviews';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const menuItems = [
    { label: t.profile, href: '/profile/edit', icon: Settings },
    { label: t.billing, href: '/billing', icon: CreditCard },
    { label: t.settings, href: '/settings', icon: Settings },
    { label: 'Report a problem', href: '#', icon: ShieldQuestion },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
       {/* Mobile View */}
      <main className="md:hidden flex-1 flex flex-col">
        <div className="p-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">Profile</h1>
        </div>
        <div className="p-4 flex items-center gap-4">
            <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
        </div>
        <div className="flex-grow p-4">
            <Card className="p-2">
                <ul className="space-y-1">
                    {menuItems.map(item => (
                        <li key={item.label}>
                            <Link href={item.href} className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5 text-muted-foreground" />
                                    <span>{item.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Link>
                        </li>
                    ))}
                     <li>
                        <button onClick={logout} className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted text-destructive">
                            <div className="flex items-center gap-3">
                                <LogOut className="w-5 h-5" />
                                <span>{t.logOut}</span>
                            </div>
                        </button>
                    </li>
                </ul>
            </Card>
        </div>
      </main>

      {/* Desktop View */}
      <main className="hidden md:block flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <Button asChild variant="outline" size="sm">
                <Link href={user.role === 'admin' ? '/admin/dashboard' : '/'}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {user.role === 'admin' ? t.adminDashboard : t.backToHome}
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
