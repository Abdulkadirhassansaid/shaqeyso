
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LayoutGrid, Users as UsersIcon, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();

  if (!user || user.role === 'admin') {
    return null; // Don't show nav if not logged in or admin
  }

  const navItems = [
    { href: '/', label: user.role === 'client' ? t.myJobPostings : t.findWork, icon: Briefcase, roles: ['freelancer', 'client'] },
    { href: '/find-freelancers', label: t.freelancers, icon: UsersIcon, roles: ['client'] },
    { href: '/my-services', label: t.myServices, icon: LayoutGrid, roles: ['freelancer'] },
    { href: '/profile', label: t.myAccount, icon: User, roles: ['freelancer', 'client'] },
  ];
  
  const userNavItems = navItems.filter(item => item.roles.includes(user.role || ''));

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
      <div className={`grid h-full max-w-lg mx-auto font-medium grid-cols-${userNavItems.length}`}>
        {userNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
