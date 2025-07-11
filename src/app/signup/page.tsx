
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
import { useLoading } from '@/hooks/use-loading';
import { cn } from '@/lib/utils';
import { Users, Briefcase } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'client' | 'freelancer'>('freelancer');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { signup } = useAuth();
  const { setIsLoading } = useLoading();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await signup(name, email, password, role);
    if (result.success) {
      setIsLoading(true);
      router.push('/');
    } else {
      let description = t.signupFailedDesc;
      if (result.message === 'email-in-use') {
        description = t.signupFailedEmailInUseDesc;
      }
      toast({
        title: t.signupFailed,
        description: description,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center justify-center">
            <Icons.logo className="h-10 w-10 text-primary" />
          </Link>
          <CardTitle>{t.createAccount}</CardTitle>
          <CardDescription>{t.signupPrompt}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.fullNameLabel}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t.yourNamePlaceholder}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12"
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className="h-12"
                />
              </div>
              <div className="space-y-3 pt-2">
                <Label>{t.iAmA}</Label>
                <RadioGroup
                  defaultValue="freelancer"
                  className="grid grid-cols-2 gap-4"
                  onValueChange={(value) => setRole(value as 'client' | 'freelancer')}
                  disabled={isSubmitting}
                >
                  <Label htmlFor="r-freelancer" className={cn("flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary", role === 'freelancer' && 'border-primary bg-primary/5')}>
                    <Briefcase className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold text-center">{t.freelancer}</span>
                    <RadioGroupItem value="freelancer" id="r-freelancer" className="mt-2" />
                  </Label>
                  <Label htmlFor="r-client" className={cn("flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary", role === 'client' && 'border-primary bg-primary/5')}>
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold text-center">{t.client}</span>
                    <RadioGroupItem value="client" id="r-client" className="mt-2"/>
                  </Label>
                </RadioGroup>
              </div>
               <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting}>
                {isSubmitting ? t.creatingAccount : t.createAccount}
              </Button>
            </form>
        </CardContent>
        <CardFooter className="flex-col gap-4 p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {t.alreadyHaveAccount}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t.signIn}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
