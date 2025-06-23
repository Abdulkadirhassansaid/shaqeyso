'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { login, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);

    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin dashboard.",
          variant: 'destructive',
        });
        setIsSubmitting(false);
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
            <Icons.logo className="h-8 w-8 text-primary" />
           </div>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
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
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isSubmitting ? t.signingIn : 'Sign In as Admin'}
            </Button>
            <p className="text-sm text-muted-foreground">
                <Link href="/" className="font-semibold text-primary hover:underline">
                    Back to Home
                </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
