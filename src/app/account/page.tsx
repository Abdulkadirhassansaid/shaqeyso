
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  User as UserIcon,
  LayoutGrid,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';

export default function AccountPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return null; // Or a loading skeleton
  }

  const menuItems = [
    {
      href: '/profile',
      label: t.profile,
      icon: UserIcon,
      roles: ['client', 'freelancer', 'admin'],
    },
    {
      href: '/my-services',
      label: t.myServices,
      icon: LayoutGrid,
      roles: ['freelancer'],
    },
    {
      href: '/billing',
      label: t.billing,
      icon: CreditCard,
      roles: ['client', 'freelancer'],
    },
    {
      href: '/settings',
      label: t.settings,
      icon: Settings,
      roles: ['client', 'freelancer', 'admin'],
    },
  ];

  const userMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 container mx-auto py-4 px-2 sm:px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 p-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{user.name}</h1>
                    {user.verificationStatus === 'verified' && <BadgeCheck className="h-5 w-5 text-primary" />}
                </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <nav>
              <ul className="divide-y">
                {userMenuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Card>

          <Card>
             <div className="p-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                >
                    <LogOut className="mr-4 h-5 w-5" />
                    <span className="font-medium">{t.logOut}</span>
                </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
