
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { ChevronRight, Settings, CreditCard, LogOut, User as UserIcon, Briefcase } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    return null;
  }

  const menuItems = [
    { label: t.profile, href: '/profile/edit', icon: UserIcon, roles: ['client', 'freelancer', 'admin'] },
    { label: t.myServices, href: '/my-services', icon: Briefcase, roles: ['freelancer'] },
    { label: t.billing, href: '/billing', icon: CreditCard, roles: ['client', 'freelancer'] },
    { label: t.settings, href: '/settings', icon: Settings, roles: ['client', 'freelancer', 'admin'] },
  ];
  
  const userMenuItems = menuItems.filter(item => item.roles.includes(user.role));


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
       <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
         <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6 p-4">
                <Avatar className="h-28 w-28 border-4 border-primary/20">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                    <p className="text-base text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <div className="mt-8 space-y-3">
                {userMenuItems.map(item => (
                    <Link 
                        key={item.label} 
                        href={item.href} 
                        className="group block rounded-xl border bg-card p-4 text-card-foreground shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-secondary rounded-lg text-primary group-hover:bg-primary/20">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-lg font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
                <div className="pt-4">
                    <Button onClick={logout} variant="outline" className="w-full justify-center p-6 border-2 text-lg text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                        <LogOut className="w-6 h-6 mr-3" />
                        <span>{t.logOut}</span>
                    </Button>
                </div>
            </div>
         </div>
      </main>
    </div>
  );
}
