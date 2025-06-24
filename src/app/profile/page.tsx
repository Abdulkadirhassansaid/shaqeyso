
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight, Settings, CreditCard, LogOut, User as UserIcon } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
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
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const menuItems = [
    { label: t.profile, href: '/profile/edit', icon: UserIcon },
    { label: t.billing, href: '/billing', icon: CreditCard },
    { label: t.settings, href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
       <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
         <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 text-center sm:text-left">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-base text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <div className="mt-8">
                <ul className="space-y-2">
                    {menuItems.map(item => (
                        <li key={item.label}>
                            <Link href={item.href} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted border">
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-lg">{item.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Link>
                        </li>
                    ))}
                     <li className="pt-4">
                        <Button onClick={logout} variant="outline" className="w-full justify-start p-4 border text-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
                           <div className="flex items-center gap-4">
                                <LogOut className="w-6 h-6" />
                                <span>{t.logOut}</span>
                            </div>
                        </Button>
                    </li>
                </ul>
            </div>
         </div>
      </main>
    </div>
  );
}
