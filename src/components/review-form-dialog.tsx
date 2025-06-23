
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Job, User } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';
import { Label } from './ui/label';
import { StarRating } from './star-rating';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface ReviewFormDialogProps {
  job: Job;
  reviewee?: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobId: string, revieweeId: string, rating: number, comment: string) => void;
}

export function ReviewFormDialog({ job, reviewee, isOpen, onClose, onSubmit }: ReviewFormDialogProps) {
  const { t } = useLanguage();
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewee) return;
    setIsSubmitting(true);
    onSubmit(job.id, reviewee.id, rating, comment);
    setIsSubmitting(false);
  };
  
  // Reset state when dialog opens for a new review
  React.useEffect(() => {
      if (isOpen) {
          setRating(0);
          setComment('');
      }
  }, [isOpen]);

  if (!reviewee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>{t.leaveReview}</DialogTitle>
            <DialogDescription>
                <div className="flex items-center gap-4 mt-4">
                    <Avatar>
                        <AvatarImage src={reviewee.avatarUrl} />
                        <AvatarFallback>{reviewee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{reviewee.name}</p>
                        <p className="text-sm text-muted-foreground">{t.job}: {job.title}</p>
                    </div>
                </div>
            </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="rating">{t.yourRating}</Label>
                    <StarRating rating={rating} onRatingChange={setRating} editable size={24}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="comment">{t.yourReview}</Label>
                    <Textarea 
                        id="comment" 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t.reviewPlaceholder}
                        rows={5}
                        required
                    />
                </div>
            </div>
            <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t.cancel}</Button>
            <Button type="submit" disabled={rating === 0 || !comment.trim() || isSubmitting}>
                {isSubmitting ? t.submittingReview : t.submitReview}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
