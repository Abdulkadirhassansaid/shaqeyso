
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Check, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { auth } from '@/lib/firebase';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (isLoading) {
      return; // Wait for the initial auth state to load
    }
    
    // If the auth context has no user object yet...
    if (!user) {
      // ...but Firebase Auth *does* have an authenticated user...
      if (auth?.currentUser) {
        // ...then we are in a temporary state during signup where the user document is still loading from Firestore.
        // We wait for the `useAuth` hook to provide the user object.
        return;
      }
      // If there's no user in context and no user in Firebase Auth, they need to sign up.
      router.replace('/signup');
    } else if (user.verificationStatus === 'verified') {
      // If the user is already verified, they don't need to be on this page.
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.verificationStatus === 'verified') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* You can add a skeleton loader here */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icons.logo className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl">{t.welcomeToPlatform.replace('{name}', user.name)}</CardTitle>
          <CardDescription className="text-lg">
            {t.onboardingDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <h3 className="font-semibold">{t.onboardingSecureTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.onboardingSecureDesc}</p>
            </div>
            <div className="rounded-lg border p-4">
              <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <h3 className="font-semibold">{t.onboardingVerifiedTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.onboardingVerifiedDesc}</p>
            </div>
          </div>
          <p className="text-muted-foreground">{t.onboardingNextStep}</p>
          <Button asChild size="lg">
            <Link href="/verify">{t.startVerification}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
