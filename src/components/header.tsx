'use client';

import Link from 'next/link';
import { Icons } from './icons';
import { UserNav } from './user-nav';
import { LanguageSwitcher } from './language-switcher';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline sm:inline-block">
            Shaqo Finder
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <LanguageSwitcher />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
