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
import { useLoading } from '@/hooks/use-loading';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { login, isLoading: isAuthLoading } = useAuth();
  const { setIsLoading } = useLoading();
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
        setIsLoading(true);
        router.push('/onboarding');
        return;
      }
      
      const redirectUrl = searchParams.get('redirect');
      
      if (result.user.role === 'admin') {
          setIsLoading(true);
          router.push('/');
          return;
      }
      
      if (redirectUrl && redirectUrl.toLowerCase().startsWith('/admin')) {
          setIsLoading(true);
          router.push('/');
      } else {
          setIsLoading(true);
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
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4 flex items-center justify-center">
                <Icons.logo className="h-10 w-10 text-primary" />
            </Link>
          <CardTitle>{t.welcomeBack}</CardTitle>
          <CardDescription>{t.loginPrompt}</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDisabled}
                className="h-12"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" size="lg" className="w-full" disabled={isDisabled}>
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
  );
}
