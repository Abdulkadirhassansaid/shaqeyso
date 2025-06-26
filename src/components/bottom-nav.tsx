
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LayoutGrid, Users as UsersIcon, Briefcase, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useUsers } from '@/hooks/use-users';

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { openChat } = useChat();
  const { users } = useUsers();

  const adminUser = users.find(u => u.role === 'admin');

  if (!user || user.role === 'admin') {
    return null; // Don't show nav if not logged in or admin
  }

  const navItems = [
    { type: 'link' as const, href: '/', label: user.role === 'client' ? t.myJobPostings : t.findWork, icon: Briefcase, roles: ['freelancer', 'client'] },
    { type: 'link' as const, href: '/find-freelancers', label: t.freelancers, icon: UsersIcon, roles: ['client'] },
    { type: 'link' as const, href: '/my-services', label: t.myServices, icon: LayoutGrid, roles: ['freelancer'] },
    // A conditional button
    ...(adminUser ? [{ type: 'button' as const, id: 'support-chat', label: t.supportChat, icon: LifeBuoy, onClick: () => openChat(adminUser), roles: ['freelancer', 'client'] }] : []),
    { type: 'link' as const, href: '/account', label: t.myAccount, icon: User, roles: ['freelancer', 'client'] },
  ];
  
  const userNavItems = navItems.filter(item => item.roles.includes(user.role || ''));

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
      <div className={`grid h-full max-w-lg mx-auto font-medium grid-cols-${userNavItems.length}`}>
        {userNavItems.map((item) => {
          if (item.type === 'link') {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex flex-col items-center justify-center px-5 group transition-colors hover:bg-primary/10 hover:text-primary relative',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          }
          if (item.type === 'button') {
             return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  'inline-flex flex-col items-center justify-center px-5 group transition-colors hover:bg-primary/10 hover:text-primary relative',
                  'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          }
          return null;
        })}
      </div>
    </div>
  );
}
