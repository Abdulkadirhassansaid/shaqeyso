
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, CreditCard, LayoutGrid } from 'lucide-react';
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
    { href: '/', label: 'Jobs', icon: LayoutGrid, roles: ['freelancer', 'client', 'admin'] },
    { href: '/billing', label: 'Billing', icon: CreditCard, roles: ['freelancer', 'client', 'admin'] },
    { href: '/profile', label: 'Profile', icon: User, roles: ['freelancer', 'client', 'admin'] },
  ];

  const userNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t">
      <div className={`grid h-full max-w-lg grid-cols-${userNavItems.length} mx-auto font-medium`}>
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
