
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { CreditCard, PlusCircle } from 'lucide-react';

// Mock data for the billing page
const mockTransactions = [
  { id: 'txn-1', date: '2024-07-20', description: 'Payment for "E-commerce Website"', amount: 2500, status: 'Completed' },
  { id: 'txn-2', date: '2024-07-18', description: 'Withdrawal to Bank Account', amount: -1500, status: 'Completed' },
  { id: 'txn-3', date: '2024-07-15', description: 'Payment for "Mobile App Design"', amount: 1800, status: 'Completed' },
  { id: 'txn-4', date: '2024-07-10', description: 'Platform Service Fee', amount: -250, status: 'Completed' },
  { id: 'txn-5', date: '2024-07-05', description: 'Payment for "Blog Content"', amount: 500, status: 'Pending' },
];

export default function BillingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">{t.billingTitle}</h1>
            <p className="text-muted-foreground mt-1">{t.billingDescription}</p>
          </header>

          {user.role === 'freelancer' && (
            <Card>
              <CardHeader>
                <CardTitle>{t.currentBalance}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">$2800.00</p>
                <p className="text-sm text-muted-foreground mt-1">{t.availableForWithdrawal}</p>
              </CardContent>
              <CardFooter>
                  <Button>{t.withdrawFunds}</Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>{t.paymentMethods}</CardTitle>
                  <CardDescription>{t.paymentMethodsDesc}</CardDescription>
              </div>
              <Button variant="outline">
                <PlusCircle className="mr-2" />
                {t.addPaymentMethod}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Visa ending in 1234</p>
                    <p className="text-sm text-muted-foreground">{t.expires} 12/2026</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">{t.remove}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.transactionHistory}</CardTitle>
              <CardDescription>{t.transactionHistoryDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.description}</TableHead>
                    <TableHead className="text-right">{t.amount}</TableHead>
                    <TableHead className="text-right">{t.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={tx.status === 'Completed' ? 'default' : 'secondary'}>{t[tx.status.toLowerCase() as keyof typeof t] || tx.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
