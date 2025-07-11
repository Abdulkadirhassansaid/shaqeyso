
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Icons } from './icons';
import { UserNav } from './user-nav';
import { useLanguage } from '@/hooks/use-language';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden md:block">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-8 w-8" />
          <span className="font-bold">Shaqeyso Hub</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-1">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
