
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
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  BadgeCheck,
  LifeBuoy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DirectChatDialog } from '@/components/direct-chat-dialog';
import { useUsers } from '@/hooks/use-users';

export default function AccountPage() {
  const { user, logout, isLoading, hasUnreadAdminMessages } = useAuth();
  const { users } = useUsers();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return null; // Or a loading skeleton
  }
  
  const adminUser = users.find(u => u.role === 'admin');

  const menuItems = [
    {
      href: '/profile',
      label: t.profile,
      icon: UserIcon,
      roles: ['client', 'freelancer', 'admin'],
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
    {
      id: 'support-chat',
      label: t.supportChat,
      icon: LifeBuoy,
      roles: ['client', 'freelancer'],
      onClick: () => setIsChatOpen(true),
      notification: hasUnreadAdminMessages,
    },
  ];

  const userMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <>
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
                {userMenuItems.map((item) => {
                  const itemContent = (
                    <>
                      <div className="relative flex items-center gap-4">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                         {item.notification && (
                            <span className="absolute left-0 -top-1 flex h-2.5 w-2.5">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </>
                  );
                  return (
                    <li key={item.label}>
                      {'href' in item && item.href ? (
                        <Link href={item.href} className="flex items-center justify-between p-4 transition-colors hover:bg-muted">
                            {itemContent}
                        </Link>
                      ) : (
                        'onClick' in item && (
                            <button onClick={item.onClick} className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted">
                                {itemContent}
                            </button>
                        )
                      )}
                    </li>
                  )
                })}
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
    {adminUser && (
        <DirectChatDialog
            otherUser={adminUser}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
        />
    )}
    </>
  );
}
