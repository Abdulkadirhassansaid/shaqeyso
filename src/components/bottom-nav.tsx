
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LayoutGrid, Users as UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();

  if (!user) {
    return null; // Don't show nav if not logged in
  }

  const navItems = [
    { href: '/', label: t.jobs, icon: LayoutGrid, roles: ['freelancer', 'client', 'admin'] },
    { href: '/find-freelancers', label: t.freelancers, icon: UsersIcon, roles: ['client'] },
    { href: '/profile', label: t.myAccount, icon: User, roles: ['freelancer', 'client', 'admin'] },
  ];

  const userNavItems = navItems.filter(item => item.roles.includes(user.role || ''));

  // If there are only two items (for Freelancer or Admin), use the gapped 3-column layout
  if (userNavItems.length === 2) {
      const firstItem = userNavItems[0];
      const lastItem = userNavItems[1];

      return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t">
          <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
            <Link
                key={firstItem.href}
                href={firstItem.href}
                className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group col-start-1',
                pathname === firstItem.href ? 'text-primary' : 'text-muted-foreground'
                )}
            >
                <firstItem.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{firstItem.label}</span>
            </Link>
            <Link
                key={lastItem.href}
                href={lastItem.href}
                className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group col-start-3',
                pathname === lastItem.href ? 'text-primary' : 'text-muted-foreground'
                )}
            >
                <lastItem.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{lastItem.label}</span>
            </Link>
          </div>
        </div>
      )
  }

  // Otherwise, use a grid layout with 3 items (for Client)
  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
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
