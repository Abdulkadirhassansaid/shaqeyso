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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

export default function SignupPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'client' | 'freelancer'>('freelancer');
  const [isLoading, setIsLoading] = React.useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await signup(name, email, password, role);
    if (success) {
      router.push('/');
    } else {
      toast({
        title: t.signupFailed,
        description: t.signupFailedDesc,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Icons.logo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{t.createAccount}</CardTitle>
          <CardDescription>{t.signupPrompt}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.fullNameLabel}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t.yourNamePlaceholder}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
             <div className="space-y-2">
              <Label>{t.iAmA}</Label>
              <RadioGroup
                defaultValue="freelancer"
                className="flex gap-4"
                onValueChange={(value) => setRole(value as 'client' | 'freelancer')}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="freelancer" id="r-freelancer" />
                  <Label htmlFor="r-freelancer">{t.freelancer}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client" id="r-client" />
                  <Label htmlFor="r-client">{t.client}</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t.creatingAccount : t.createAccount}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t.alreadyHaveAccount}{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                {t.signIn}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
