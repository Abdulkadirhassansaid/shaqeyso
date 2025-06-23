
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/use-language';
import type { Job, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowRight, Banknote } from 'lucide-react';

interface ApprovePaymentDialogProps {
  job: Job;
  freelancer?: User;
  onConfirm: () => void;
  children: React.ReactNode;
}

export function ApprovePaymentDialog({ job, freelancer, onConfirm, children }: ApprovePaymentDialogProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-2xl">{t.releaseEscrowPayment}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {t.releaseEscrowDesc}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 flex items-center justify-around gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
                <Avatar>
                    <AvatarImage src="https://placehold.co/100x100/E8F5FF/000000.png?text=FI" alt="Client"/>
                    <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">{t.escrow}</div>
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />
             <div className="flex flex-col items-center gap-2">
                <Avatar>
                    <AvatarImage src={freelancer?.avatarUrl} alt={freelancer?.name}/>
                    <AvatarFallback>{freelancer?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">{freelancer?.name}</div>
            </div>
        </div>
        
        <div className="rounded-lg border bg-muted p-4 text-center">
            <div className="text-sm text-muted-foreground">{t.amountToBeReleased}</div>
            <div className="text-3xl font-bold text-primary">${job.budget.toFixed(2)}</div>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-4">
            {t.finalPaymentWarning}
        </p>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="gap-2">
            <Banknote className="h-5 w-5"/>
            {t.approveAndPay}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
