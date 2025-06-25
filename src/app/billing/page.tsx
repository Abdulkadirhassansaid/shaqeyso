
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { CreditCard, PlusCircle, Wallet, Smartphone, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { PaymentMethod } from '@/lib/types';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function BillingPage() {
  const { user, isLoading, addPaymentMethod, removePaymentMethod, addTransaction } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isAddMethodOpen, setAddMethodOpen] = React.useState(false);
  const [methodType, setMethodType] = React.useState<PaymentMethod['type'] | ''>('');
  const [newCard, setNewCard] = React.useState({ last4: '', expiry: '' });
  const [newPhone, setNewPhone] = React.useState('');

  // State for Top Up Dialog
  const [isTopUpOpen, setTopUpOpen] = React.useState(false);
  const [topUpAmount, setTopUpAmount] = React.useState('');
  const [selectedMethodId, setSelectedMethodId] = React.useState<string | undefined>(undefined);


  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);
  
  if (isLoading || !user) {
    return null;
  }
  
  const balance = (user.transactions || []).reduce((acc, tx) => acc + tx.amount, 0);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodType) {
        toast({ title: t.selectPaymentMethod, variant: 'destructive' });
        return;
    }

    let newMethod: Omit<PaymentMethod, 'id'> | null = null;
    const isFirstMethod = !(user.paymentMethods && user.paymentMethods.length > 0);

    if (methodType === 'Visa' || methodType === 'Mastercard') {
        if (newCard.last4.length !== 4 || !/^\d{2}\/\d{2}$/.test(newCard.expiry)) {
            toast({ title: t.invalidCardDetails, description: t.invalidCardDetailsDesc, variant: 'destructive' });
            return;
        }
        const [month, year] = newCard.expiry.split('/');
        newMethod = {
            type: methodType,
            last4: newCard.last4,
            expiryMonth: parseInt(month),
            expiryYear: 2000 + parseInt(year),
            isPrimary: isFirstMethod,
        };
    } else {
        if (newPhone.length < 9) { // Simple validation for phone number
            toast({ title: t.invalidPhoneNumber, description: t.invalidPhoneNumberDesc, variant: 'destructive' });
            return;
        }
        newMethod = {
            type: methodType,
            phoneNumber: newPhone,
            isPrimary: isFirstMethod,
        };
    }

    await addPaymentMethod(user.id, newMethod);
    toast({ title: t.cardAddedSuccess, description: t.cardAddedSuccessDesc });
    setNewCard({ last4: '', expiry: '' });
    setNewPhone('');
    setMethodType('');
    setAddMethodOpen(false);
  };

  const handleRemoveCard = async (methodId: string) => {
    await removePaymentMethod(user.id, methodId);
    toast({ title: t.cardRemovedSuccess, description: t.cardRemovedSuccessDesc });
  };
  
  const handleWithdraw = async () => {
    if (balance <= 0) return;
    const withdrawalAmount = balance;
    await addTransaction(user.id, {
        description: t.withdrawalToBank,
        amount: -withdrawalAmount,
        status: 'Pending',
    });
    toast({ title: t.withdrawalInitiated, description: t.withdrawalInitiatedDesc });
  };
  
  const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
        case 'Visa':
        case 'Mastercard':
            return <CreditCard className="h-8 w-8 text-muted-foreground" />;
        case 'EVC Plus':
        case 'EDahab':
        case 'Zaad':
            return <Smartphone className="h-8 w-8 text-muted-foreground" />;
        default:
            return <Wallet className="h-8 w-8 text-muted-foreground" />;
    }
  }

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);

    if (isNaN(amount) || amount <= 0) {
        toast({ title: t.invalidAmount, variant: 'destructive' });
        return;
    }
    if (!selectedMethodId) {
        toast({ title: t.mustSelectPaymentMethod, variant: 'destructive' });
        return;
    }
    
    const method = user.paymentMethods?.find(pm => pm.id === selectedMethodId);
    if (!method) return;

    const description = method.last4 
        ? `${t.topUpFrom} ${method.type} ****${method.last4}`
        : `${t.topUpFrom} ${method.type} (${method.phoneNumber})`;

    await addTransaction(user.id, {
        description: description,
        amount: amount,
        status: 'Completed',
    });

    toast({ title: t.topUpSuccessTitle, description: t.topUpSuccessDesc });
    setTopUpAmount('');
    setSelectedMethodId(undefined);
    setTopUpOpen(false);
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <Button asChild variant="outline" size="sm">
                <Link href="/profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.profile}
                </Link>
            </Button>
          </div>
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
                <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.availableForWithdrawal}</p>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleWithdraw} disabled={balance <= 0}>{t.withdrawFunds}</Button>
              </CardFooter>
            </Card>
          )}

          {user.role === 'client' && (
             <Card>
              <CardHeader>
                <CardTitle>{t.yourBalance}</CardTitle>
                <CardDescription>{t.topUpDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
              </CardContent>
              <CardFooter>
                  <Dialog open={isTopUpOpen} onOpenChange={setTopUpOpen}>
                    <DialogTrigger asChild>
                        <Button>{t.topUpBalance}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.topUpDialogTitle}</DialogTitle>
                            <DialogDescription>{t.topUpDialogDesc}</DialogDescription>
                        </DialogHeader>
                         <form onSubmit={handleTopUp}>
                            <div className="grid gap-4 py-4">
                               <div className="space-y-2">
                                    <Label htmlFor="top-up-amount">{t.topUpAmount}</Label>
                                    <Input id="top-up-amount" type="number" placeholder={t.topUpAmountPlaceholder} value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} required />
                               </div>
                               <div className="space-y-2">
                                   <Label>{t.selectPaymentMethod}</Label>
                                    <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId}>
                                        {(user.paymentMethods || []).map(method => (
                                            <div key={method.id} className="flex items-center space-x-2 border rounded-md p-3">
                                                <RadioGroupItem value={method.id} id={method.id} />
                                                <Label htmlFor={method.id} className="flex items-center gap-2 font-normal w-full cursor-pointer">
                                                    {getPaymentMethodIcon(method.type)}
                                                     {method.last4 ? (
                                                        <span>{method.type} {t.endingIn} {method.last4}</span>
                                                     ) : (
                                                        <span>{method.type} ({method.phoneNumber})</span>
                                                     )}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                    {(user.paymentMethods || []).length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center">{t.noPaymentMethods}</p>
                                    )}
                               </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">{t.cancel}</Button>
                                </DialogClose>
                                <Button type="submit" disabled={(user.paymentMethods || []).length === 0}>{t.confirmTopUp}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                  </Dialog>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>{t.paymentMethods}</CardTitle>
                  <CardDescription>{t.paymentMethodsDesc}</CardDescription>
              </div>
              <Dialog open={isAddMethodOpen} onOpenChange={setAddMethodOpen}>
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
                    <form onSubmit={handleAddMethod}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment-type">{t.selectPaymentMethod}</Label>
                                <Select onValueChange={(value) => setMethodType(value as PaymentMethod['type'])} value={methodType}>
                                    <SelectTrigger id="payment-type">
                                        <SelectValue placeholder={t.selectPaymentMethod} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Visa">{t.creditCard}</SelectItem>
                                        <SelectItem value="EVC Plus">{t.evcPlus}</SelectItem>
                                        <SelectItem value="EDahab">{t.eDahab}</SelectItem>
                                        <SelectItem value="Zaad">{t.zaad}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(methodType === 'Visa' || methodType === 'Mastercard') && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-last4">{t.cardLast4Label}</Label>
                                        <Input id="card-last4" value={newCard.last4} onChange={e => setNewCard({...newCard, last4: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="1234" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="card-expiry">{t.cardExpiryLabel}</Label>
                                        <Input id="card-expiry" value={newCard.expiry} onChange={e => setNewCard({...newCard, expiry: e.target.value})} placeholder="MM/YY" required />
                                    </div>
                                </>
                            )}
                            {(methodType === 'EVC Plus' || methodType === 'EDahab' || methodType === 'Zaad') && (
                                <div className="space-y-2">
                                    <Label htmlFor="phone-number">{t.phoneNumber}</Label>
                                    <Input id="phone-number" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 61xxxxxxx" required />
                                </div>
                            )}
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
                                {getPaymentMethodIcon(method.type)}
                                {method.last4 ? (
                                    <div>
                                        <p className="font-medium">{method.type} {t.endingIn} {method.last4}</p>
                                        <p className="text-sm text-muted-foreground">{t.expires} {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear?.toString().slice(-2)}</p>
                                    </div>
                                ) : (
                                     <div>
                                        <p className="font-medium">{method.type}</p>
                                        <p className="text-sm text-muted-foreground">{t.phoneNumber}: ****{method.phoneNumber?.slice(-4)}</p>
                                    </div>
                                )}
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
