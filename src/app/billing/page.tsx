
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
import { CreditCard, PlusCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { PaymentMethod } from '@/lib/types';
import { format } from 'date-fns';

export default function BillingPage() {
  const { user, isLoading, addPaymentMethod, removePaymentMethod, addTransaction, refreshUser } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isAddCardOpen, setAddCardOpen] = React.useState(false);
  const [newCard, setNewCard] = React.useState({ last4: '', expiry: '' });

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
  
  const currentBalance = user.role === 'freelancer' 
    ? (user.transactions || []).reduce((acc, tx) => acc + tx.amount, 0)
    : 0;

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.last4.length !== 4 || !/^\d{2}\/\d{2}$/.test(newCard.expiry)) {
        toast({ title: t.invalidCardDetails, description: t.invalidCardDetailsDesc, variant: 'destructive' });
        return;
    }
    const [month, year] = newCard.expiry.split('/');
    const newMethod: Omit<PaymentMethod, 'id'> = {
        type: 'Visa', // Mock
        last4: newCard.last4,
        expiryMonth: parseInt(month),
        expiryYear: 2000 + parseInt(year),
        isPrimary: !(user.paymentMethods && user.paymentMethods.length > 0),
    };
    await addPaymentMethod(user.id, newMethod);
    toast({ title: t.cardAddedSuccess, description: t.cardAddedSuccessDesc });
    setNewCard({ last4: '', expiry: '' });
    setAddCardOpen(false);
  };

  const handleRemoveCard = async (methodId: string) => {
    await removePaymentMethod(user.id, methodId);
    toast({ title: t.cardRemovedSuccess, description: t.cardRemovedSuccessDesc });
  };
  
  const handleWithdraw = async () => {
    if (currentBalance <= 0) return;
    const withdrawalAmount = currentBalance;
    await addTransaction(user.id, {
        description: t.withdrawalToBank,
        amount: -withdrawalAmount,
        status: 'Pending',
    });
    toast({ title: t.withdrawalInitiated, description: `${t.withdrawalInitiatedDesc} $${withdrawalAmount.toFixed(2)}.` });
    refreshUser();
  };

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
                <p className="text-4xl font-bold">${currentBalance.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.availableForWithdrawal}</p>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleWithdraw} disabled={currentBalance <= 0}>{t.withdrawFunds}</Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>{t.paymentMethods}</CardTitle>
                  <CardDescription>{t.paymentMethodsDesc}</CardDescription>
              </div>
              <Dialog open={isAddCardOpen} onOpenChange={setAddCardOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <PlusCircle className="mr-2" />
                        {t.addPaymentMethod}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.addCardTitle}</DialogTitle>
                        <DialogDescription>{t.addCardDesc}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCard}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="card-last4">{t.cardLast4Label}</Label>
                                <Input id="card-last4" value={newCard.last4} onChange={e => setNewCard({...newCard, last4: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="1234" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="card-expiry">{t.cardExpiryLabel}</Label>
                                <Input id="card-expiry" value={newCard.expiry} onChange={e => setNewCard({...newCard, expiry: e.target.value})} placeholder="MM/YY" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">{t.cancel}</Button>
                            </DialogClose>
                            <Button type="submit">{t.addCardAction}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {(user.paymentMethods || []).length > 0 ? (
                <div className='space-y-4'>
                    {(user.paymentMethods || []).map(method => (
                        <div key={method.id} className="border rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{method.type} {t.endingIn} {method.last4}</p>
                                <p className="text-sm text-muted-foreground">{t.expires} {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear.toString().slice(-2)}</p>
                            </div>
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">{t.remove}</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t.removeCardConfirmTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t.removeCardConfirmDesc}
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveCard(method.id)} className="bg-destructive hover:bg-destructive/90">{t.remove}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>{t.noPaymentMethods}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.transactionHistory}</CardTitle>
              <CardDescription>{t.transactionHistoryDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {(user.transactions || []).length > 0 ? (
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
                    {(user.transactions || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                        <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.date), 'yyyy-MM-dd')}</TableCell>
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
              ) : (
                 <div className="text-center text-muted-foreground py-8">
                    <p>{t.noTransactions}</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
