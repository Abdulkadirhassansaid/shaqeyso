
'use client';

import Link from 'next/link';
import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';
import { useLanguage } from '@/hooks/use-language';
import { BadgeCheck, LifeBuoy } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useUsers } from '@/hooks/use-users';
import { usePresence } from '@/hooks/use-presence';
import { OnlineIndicator } from './online-indicator';

export function UserNav() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();
  const { openChat } = useChat();
  const { users, isUsersLoading } = useUsers();
  const { isUserOnline } = usePresence();
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(user?.avatarUrl);

  const adminUser = users.find(u => u.role === 'admin');
  const isAdminOnline = adminUser ? isUserOnline(adminUser.id) : false;

  React.useEffect(() => {
    if (user) {
        const localAvatar = localStorage.getItem(`mock_avatar_${user.id}`);
        setAvatarUrl(localAvatar || user.avatarUrl);
    }
  }, [user]);

  if (isAuthLoading || isUsersLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }
  
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
            <Link href="/login">{t.logIn}</Link>
        </Button>
        <Button asChild size="sm">
            <Link href="/signup">{t.signUp}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                {user.verificationStatus === 'verified' && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">{t.profile}</Link>
          </DropdownMenuItem>
          {user.role === 'freelancer' && (
            <DropdownMenuItem asChild>
              <Link href="/my-services">{t.myServices}</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/billing">{t.billing}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">{t.settings}</Link>
          </DropdownMenuItem>
          {user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard">{t.adminDashboard}</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.role !== 'admin' && adminUser && (
            <>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openChat(adminUser); }}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                           <LifeBuoy className="h-4 w-4" />
                           <span>{t.supportChat}</span>
                        </div>
                        <OnlineIndicator isOnline={isAdminOnline} />
                    </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
            </>
        )}
        <DropdownMenuItem onClick={logout}>{t.logOut}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
