
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ClientVerificationForm } from '@/components/client-verification-form';
import { FreelancerVerificationForm } from '@/components/freelancer-verification-form';
import Header from '@/components/header';
import { useLanguage } from '@/hooks/use-language';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/page-loader';

export default function VerifyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isLoading && user?.verificationStatus === 'verified') {
      router.replace('/');
    }
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader />;
  }

  if (user.verificationStatus === 'verified') {
     return <PageLoader />;
  }
  
  if (user.verificationStatus === 'pending') {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
           <Card className="w-full max-w-lg text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <Clock className="h-8 w-8" />
                </div>
                <CardTitle>{t.verificationPendingTitle}</CardTitle>
                <CardDescription>{t.verificationPendingDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t.youCanBrowse}</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild>
                    <Link href="/">{t.backToHome}</Link>
                </Button>
              </CardFooter>
            </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        {user.role === 'client' ? (
          <ClientVerificationForm user={user} />
        ) : (
          <FreelancerVerificationForm user={user} />
        )}
      </main>
    </div>
  );
}
