
'use client';

import Link from 'next/link';
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

export function UserNav() {
  const { user, logout, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
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
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
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
          <DropdownMenuItem asChild>
            <Link href="/billing">{t.billing}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">{t.settings}</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>{t.logOut}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
