'use client';

import * as React from 'react';
import Link from 'next/link';
import { Icons } from './icons';
import { UserNav } from './user-nav';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import type { User } from '@/lib/types';
import { DirectChatDialog } from './direct-chat-dialog';

export default function Header() {
  const { t } = useLanguage();
  const { user, users } = useAuth();
  const [chattingWith, setChattingWith] = React.useState<User | null>(null);

  const adminUser = users.find(u => u.role === 'admin');
  const canChat = user && user.role !== 'admin' && adminUser;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
              {t.shaqoFinder}
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-1">
              {canChat && (
                <Button variant="ghost" size="icon" onClick={() => setChattingWith(adminUser)}>
                  <MessageSquare className="h-5 w-5" />
                  <span className="sr-only">Chat with Admin</span>
                </Button>
              )}
              <UserNav />
            </nav>
          </div>
        </div>
      </header>
      {chattingWith && (
        <DirectChatDialog
          otherUser={chattingWith}
          isOpen={!!chattingWith}
          onClose={() => setChattingWith(null)}
        />
      )}
    </>
  );
}
