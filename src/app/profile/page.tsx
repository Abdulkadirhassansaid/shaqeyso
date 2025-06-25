
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, Settings, CreditCard, LogOut, User as UserIcon, Briefcase } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

  const MenuItem = ({ href, icon: Icon, label, isLogout = false }: { href?: string, icon: React.ElementType, label: string, isLogout?: boolean }) => {
    const content = (
      <div className={cn(
        "group flex items-center justify-between p-4 w-full text-left transition-colors hover:bg-muted/50",
        isLogout ? "text-destructive" : ""
      )}>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-base font-medium">{label}</span>
        </div>
        {!isLogout && <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />}
      </div>
    );

    if (isLogout) {
      return <button onClick={() => logout()} className="w-full">{content}</button>
    }

    return <Link href={href!}>{content}</Link>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="w-full h-32 bg-primary" />
       <main className="flex-1 container -mt-20 pb-10">
         <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-28 w-28 border-4 border-background bg-background shadow-lg mb-3">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-base text-muted-foreground">{user.email}</p>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {userMenuItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                       <MenuItem href={item.href} icon={item.icon} label={item.label} />
                       {index < userMenuItems.length -1 && <Separator />}
                    </React.Fragment>
                  ))}
                  <Separator />
                   <MenuItem icon={LogOut} label={t.logOut} isLogout={true} />
                </div>
              </CardContent>
            </Card>

         </div>
      </main>
    </div>
  );
}
