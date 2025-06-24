'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { login, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);

    if (result.success && result.user) {
      if (result.user.verificationStatus === 'unverified' && result.user.role !== 'admin') {
        router.push('/onboarding');
        return;
      }
      
      const redirectUrl = searchParams.get('redirect');
      
      if (result.user.role === 'admin') {
          router.push('/');
          return;
      }
      
      if (redirectUrl && redirectUrl.toLowerCase().startsWith('/admin')) {
          router.push('/');
      } else {
          router.push(redirectUrl || '/');
      }
    } else {
      if (result.message === 'blocked') {
        toast({
          title: t.accountBlocked,
          description: t.accountBlockedDesc,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t.loginFailed,
          description: t.loginFailedDesc,
          variant: 'destructive',
        });
      }
      setIsSubmitting(false);
    }
  };
  
  const isDisabled = isSubmitting || isAuthLoading;

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:bg-muted">
      {/* Desktop View */}
      <div className="hidden md:block w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Icons.logo className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t.welcomeBack}</CardTitle>
            <CardDescription>{t.loginPrompt}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-desktop">{t.emailLabel}</Label>
                <Input
                  id="email-desktop"
                  type="email"
                  placeholder="user@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-desktop">{t.passwordLabel}</Label>
                <Input
                  id="password-desktop"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isDisabled}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isDisabled}>
                {isSubmitting ? t.signingIn : t.signIn}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t.noAccount}{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                  {t.signUp}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex h-full w-full flex-col p-4">
        <div className="flex-grow flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-8">Email Login</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="email-mobile"
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password-mobile"
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDisabled}
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={isDisabled}>
              {isSubmitting ? t.signingIn : 'Login'}
            </Button>
          </form>
        </div>
        <div className="flex-none text-center">
          <p className="text-sm text-muted-foreground">
            {t.noAccount}{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {t.signUp}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
