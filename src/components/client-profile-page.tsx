
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Review } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Star } from 'lucide-react';
import { useReviews } from '@/hooks/use-reviews';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { StarRating } from './star-rating';

interface ClientProfilePageProps {
  user: User;
}

export function ClientProfilePage({ user }: ClientProfilePageProps) {
  const { updateUserProfile, clientProfiles, users } = useAuth();
  const { reviews } = useReviews();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  
  const clientProfile = clientProfiles.find(p => p.userId === user.id);
  const clientReviews = reviews.filter(r => r.revieweeId === user.id);
  const averageRating = clientReviews.length > 0
    ? clientReviews.reduce((acc, r) => acc + r.rating, 0) / clientReviews.length
    : 0;

  const [companyName, setCompanyName] = React.useState(user.name);
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const userData = { 
      name: companyName,
      ...(avatar && { avatarUrl: avatar })
    };
    
    const success = await updateUserProfile(user.id, userData);

    if (success) {
      toast({
        title: t.profileUpdated,
        description: t.profileUpdatedDesc,
      });
    } else {
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.companyProfile}</CardTitle>
            <CardDescription>{t.companyProfileDesc}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar || user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={isSaving}>
                    <Camera className="mr-2 h-4 w-4" />
                    {t.uploadLogo}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">{t.uploadLogoDesc}</p>
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">{t.companyName}</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input id="email" value={user.email} disabled />
              </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? t.saving : t.saveChanges}
                </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="md:col-span-1 space-y-6">
          <Card>
              <CardHeader>
                  <CardTitle>{t.ratingsAndReviews}</CardTitle>
              </CardHeader>
              <CardContent>
                  {clientReviews.length > 0 ? (
                      <div className="space-y-4">
                          <div className="text-center">
                              <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
                              <div className="flex justify-center">
                                <StarRating rating={averageRating} size={20} />
                              </div>
                              <p className="text-sm text-muted-foreground">({clientReviews.length} {t.ratingsAndReviews.toLowerCase()})</p>
                          </div>
                          <Separator />
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                              {clientReviews.map(review => {
                                  const reviewer = users.find(u => u.id === review.reviewerId);
                                  return (
                                      <div key={review.id} className="space-y-2">
                                          <div className="flex items-center gap-2">
                                              <Avatar className="h-8 w-8">
                                                  <AvatarImage src={reviewer?.avatarUrl} />
                                                  <AvatarFallback>{reviewer?.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="text-sm font-medium">{reviewer?.name}</p>
                                                  <StarRating rating={review.rating} />
                                              </div>
                                          </div>
                                          <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                                          <p className="text-xs text-muted-foreground text-right">{format(new Date(review.date), 'dd MMM yyyy')}</p>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ) : (
                      <p className="text-sm text-muted-foreground text-center">{t.noReviewsYet}</p>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
