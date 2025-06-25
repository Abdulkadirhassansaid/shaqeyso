
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Review, ClientProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Star, BadgeCheck, ArrowLeft, Link } from 'lucide-react';
import { useReviews } from '@/hooks/use-reviews';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { StarRating } from './star-rating';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { ImageCropper } from './image-cropper';
import { fileToDataUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClientProfilePageProps {
  user: User;
}

export function ClientProfilePage({ user }: ClientProfilePageProps) {
  const { updateUserProfile } = useAuth();
  const { reviews } = useReviews();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [clientProfiles, setClientProfiles] = React.useState<ClientProfile[]>([]);
  const [reviewers, setReviewers] = React.useState<User[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = React.useState(true);
  const [companyName, setCompanyName] = React.useState(user.name);
  const [avatarPreview, setAvatarPreview] = React.useState<string>(user.avatarUrl);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [isUrlDialogOpen, setIsUrlDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');

  const clientProfile = clientProfiles.find(p => p.userId === user.id);

  React.useEffect(() => {
    const localAvatar = localStorage.getItem(`mock_avatar_${user.id}`);
    setAvatarPreview(localAvatar || user.avatarUrl);
  }, [user.id, user.avatarUrl]);

  React.useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'clientProfiles'), (snapshot) => {
      const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as ClientProfile));
      setClientProfiles(profilesData);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (clientProfile) {
        setCompanyName(clientProfile.companyName || user.name);
    }
  }, [user.name, clientProfile]);

  const clientReviews = reviews.filter(r => r.revieweeId === user.id);
  const averageRating = clientReviews.length > 0
    ? clientReviews.reduce((acc, r) => acc + r.rating, 0) / clientReviews.length
    : 0;

  React.useEffect(() => {
    const fetchReviewers = async () => {
        if (clientReviews.length === 0 || !db) {
            setIsLoadingReviewers(false);
            return;
        };

        const reviewerIds = [...new Set(clientReviews.map(r => r.reviewerId))];
        
        if (reviewerIds.length > 0) {
            try {
                // Firestore 'in' query is limited to 30 items. For more, you'd need multiple queries.
                const q = query(collection(db, "users"), where("id", "in", reviewerIds.slice(0, 30)));
                const querySnapshot = await getDocs(q);
                const fetchedReviewers = querySnapshot.docs.map(d => d.data() as User);
                setReviewers(fetchedReviewers);
            } catch (error) {
                console.error("Error fetching reviewers:", error);
            }
        }
        setIsLoadingReviewers(false);
    };

    fetchReviewers();
  }, [clientReviews]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const userData: Partial<User> = {
        name: companyName,
      };

      if (avatarPreview !== user.avatarUrl) {
        if (avatarPreview.startsWith('http')) {
          userData.avatarUrl = avatarPreview;
          localStorage.removeItem(`mock_avatar_${user.id}`);
        }
      }

      const profileData = {
        companyName,
      };

      const success = await updateUserProfile(user.id, userData, profileData);

      if (success) {
        toast({
          title: t.profileUpdated,
          description: t.profileUpdatedDesc,
        });
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('Error saving client profile:', error);
      toast({
        title: t.updateFailed,
        description: t.updateFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCropComplete = async (croppedImage: File) => {
    try {
        const dataUrl = await fileToDataUrl(croppedImage);
        localStorage.setItem(`mock_avatar_${user.id}`, dataUrl);
        setAvatarPreview(dataUrl);
        setImageToCrop(null);
    } catch (error) {
        toast({ title: "Error", description: "Could not process image." });
    }
  };

  const handleSetAvatarFromUrl = () => {
    if (!imageUrl || !user) return;
    setAvatarPreview(imageUrl);
    setIsUrlDialogOpen(false);
    setImageUrl('');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
          <div>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
              </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
              <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                      <CardTitle>{t.companyProfile}</CardTitle>
                      {user.verificationStatus === 'verified' && (
                          <BadgeCheck className="h-6 w-6 text-primary" />
                      )}
                  </div>
                  <CardDescription>{t.companyProfileDesc}</CardDescription>
              </CardHeader>
              <form onSubmit={handleSave}>
                  <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                      <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={isSaving}>
                            <Camera className="mr-2 h-4 w-4" />
                            {t.uploadLogo}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsUrlDialogOpen(true)} disabled={isSaving}>
                            <Link className="mr-2 h-4 w-4" />
                            {t.useUrl}
                        </Button>
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
                              {isLoadingReviewers ? (
                                      <div className="space-y-4">
                                          <Skeleton className="h-10 w-full" />
                                          <Skeleton className="h-10 w-full" />
                                      </div>
                              ) : (
                                  <div className="space-y-4 max-h-96 overflow-y-auto">
                                      {clientReviews.map(review => {
                                          const reviewer = reviewers.find(u => u.id === review.reviewerId);
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
                              )}
                          </div>
                      ) : (
                          <p className="text-sm text-muted-foreground text-center">{t.noReviewsYet}</p>
                      )}
                  </CardContent>
              </Card>
          </div>
          </div>
      </div>
      <ImageCropper
        image={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onCropComplete={handleCropComplete}
      />
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.setImageFromUrl}</DialogTitle>
                <DialogDescription>{t.setImageFromUrlDesc}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="image-url">{t.imageUrl}</Label>
                    <Input
                        id="image-url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsUrlDialogOpen(false)}>{t.cancel}</Button>
                <Button type="button" onClick={handleSetAvatarFromUrl} disabled={!imageUrl}>
                    {t.setAvatar}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
