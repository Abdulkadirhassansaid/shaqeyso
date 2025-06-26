
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { useJobs } from '@/hooks/use-jobs';
import { useReviews } from '@/hooks/use-reviews';
import { useLanguage } from '@/hooks/use-language';
import type { User, FreelancerProfile, Service } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { Search, Star, Contact, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DirectChatDialog } from '@/components/direct-chat-dialog';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type FreelancerLevel = 'New' | 'Rising Talent' | 'Top Rated';

export default function FindFreelancersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { users, isUsersLoading } = useUsers();
  const { jobs, isJobsLoading, createJobFromService } = useJobs();
  const { reviews, isReviewsLoading } = useReviews();
  const [freelancerProfiles, setFreelancerProfiles] = React.useState<FreelancerProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = React.useState(true);
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Early exit for roles should happen after hooks
  React.useEffect(() => {
    if (!isAuthLoading && user?.role === 'freelancer') {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFreelancer, setSelectedFreelancer] = React.useState<User | null>(null);
  const [chattingWith, setChattingWith] = React.useState<User | null>(null);

  // State for the new service request flow
  const [requestingService, setRequestingService] = React.useState<{ freelancer: User; service: Service } | null>(null);
  const [selectedDeliveryTier, setSelectedDeliveryTier] = React.useState<'standard' | 'fast' | null>(null);
  const [isSubmittingServiceRequest, setIsSubmittingServiceRequest] = React.useState(false);

  React.useEffect(() => {
    if (!db) return;
    const fetchProfiles = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'freelancerProfiles'));
            const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as FreelancerProfile));
            setFreelancerProfiles(profilesData);
        } catch (error) {
            console.error("Error fetching freelancer profiles: ", error);
        } finally {
            setProfilesLoading(false);
        }
    };
    fetchProfiles();
  }, []);

  const freelancers = React.useMemo(() => users.filter(u => u.role === 'freelancer' && !u.isBlocked), [users]);

  const getFreelancerLevel = React.useCallback((freelancerId: string): FreelancerLevel => {
    const completedJobs = jobs.filter(j => j.hiredFreelancerId === freelancerId && j.status === 'Completed').length;
    const freelancerReviews = reviews.filter(r => r.revieweeId === freelancerId);
    const avgRating = freelancerReviews.length > 0 ? freelancerReviews.reduce((acc, r) => acc + r.rating, 0) / freelancerReviews.length : 0;
    
    if (completedJobs >= 10 && avgRating >= 4.8) return 'Top Rated';
    if (completedJobs >= 5 && avgRating >= 4.5) return 'Rising Talent';
    return 'New';
  }, [jobs, reviews]);
  
  const getFreelancerRating = React.useCallback((freelancerId: string) => {
    const freelancerReviews = reviews.filter(r => r.revieweeId === freelancerId);
    const avgRating = freelancerReviews.length > 0 ? freelancerReviews.reduce((acc, r) => acc + r.rating, 0) / freelancerReviews.length : 0;
    return {
        rating: avgRating,
        count: freelancerReviews.length
    }
  }, [reviews]);
  
  const filteredFreelancers = React.useMemo(() => {
    return freelancers.filter(f => {
        const profile = freelancerProfiles.find(p => p.userId === f.id);
        const searchLower = searchQuery.toLowerCase();
        
        const nameMatch = f.name.toLowerCase().includes(searchLower);
        const bioMatch = profile?.bio?.toLowerCase().includes(searchLower);
        const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(searchLower));
        const hourlyRateMatch = profile?.hourlyRate?.toString().includes(searchLower);
        const levelMatch = getFreelancerLevel(f.id).toLowerCase().includes(searchLower);

        return nameMatch || bioMatch || skillMatch || hourlyRateMatch || levelMatch;
    });
  }, [freelancers, freelancerProfiles, searchQuery, getFreelancerLevel]);
  
  const isLoading = isAuthLoading || isUsersLoading || isJobsLoading || isReviewsLoading || profilesLoading;
  
  const handleRequestService = async () => {
    if (!requestingService || !selectedDeliveryTier || !user) return;
    setIsSubmittingServiceRequest(true);

    const { freelancer, service } = requestingService;
    
    const result = await createJobFromService(user.id, freelancer.id, service, selectedDeliveryTier);

    if (result.success) {
        toast({
            title: t.serviceRequestedTitle,
            description: t.serviceRequestedDesc.replace('{freelancer}', freelancer.name),
        });
        setRequestingService(null);
        setSelectedFreelancer(null); // Close the main dialog too
    } else {
        toast({
            title: t.requestFailedTitle,
            description: result.message,
            variant: 'destructive',
        });
    }
    setIsSubmittingServiceRequest(false);
  };
  
  // Effect to reset dialog state when it closes
  React.useEffect(() => {
      if (!requestingService) {
          setSelectedDeliveryTier(null);
      } else {
          // Default to standard tier when dialog opens
          setSelectedDeliveryTier('standard');
      }
  }, [requestingService]);

  const selectedProfile = freelancerProfiles.find(p => p.userId === selectedFreelancer?.id);
  
  if (!user || user.role === 'freelancer') {
      return null;
  }
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                           <Card key={i} className="flex flex-col">
                                <CardContent className="p-6 flex-grow flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                        <div className="flex-grow space-y-2">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-5 w-1/2" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-24 rounded-full mb-4" />
                                    <div className="space-y-2 mb-4 flex-grow">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t.findFreelancers}</h1>
                    <p className="text-muted-foreground">{t.findFreelancersDesc}</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder={t.searchFreelancersPlaceholder} 
                        className="pl-10 text-base h-12"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFreelancers.length > 0 ? filteredFreelancers.map(f => {
                        const level = getFreelancerLevel(f.id);
                        const { rating, count } = getFreelancerRating(f.id);
                        const profile = freelancerProfiles.find(p => p.userId === f.id);

                        return (
                           <Card key={f.id} className="flex flex-col transition-shadow hover:shadow-lg">
                                <CardContent className="p-6 flex-grow flex flex-col">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="h-16 w-16 border">
                                            <AvatarImage src={f.avatarUrl} alt={f.name} />
                                            <AvatarFallback>{f.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{f.name}</CardTitle>
                                                {profile?.hourlyRate && profile.hourlyRate > 0 ? (
                                                    <div className="text-right shrink-0">
                                                        <span className="font-bold text-lg">${profile.hourlyRate.toFixed(2)}</span>
                                                        <span className="text-xs text-muted-foreground">/hr</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StarRating rating={rating} />
                                                <span className="text-sm text-muted-foreground">({count} {t.reviews.toLowerCase()})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Badge variant={level === 'Top Rated' ? 'default' : 'secondary'} className="w-fit mb-4">
                                        {t[level.replace(' ', '').toLowerCase() as keyof typeof t] || level}
                                    </Badge>
                                    
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">{profile?.bio || t.noBio}</p>
                                    
                                    {profile?.skills && profile.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.slice(0, 3).map(skill => (
                                                <Badge key={skill} variant="outline">{skill}</Badge>
                                            ))}
                                            {profile.skills.length > 3 && (
                                                <Badge variant="outline">+{profile.skills.length - 3}</Badge>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => setSelectedFreelancer(f)}>
                                        {t.viewProfile}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    }) : (
                        <p className="text-muted-foreground text-center py-8 col-span-full">{t.noFreelancersFound}</p>
                    )}
                </div>
            </div>
            {selectedFreelancer && selectedProfile && (
                <Dialog open={!!selectedFreelancer} onOpenChange={(isOpen) => !isOpen && setSelectedFreelancer(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader className="items-center text-center space-y-4">
                             <Avatar className="h-28 w-28">
                                <AvatarImage src={selectedFreelancer.avatarUrl} alt={selectedFreelancer.name} />
                                <AvatarFallback>{selectedFreelancer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl">{selectedFreelancer.name}</DialogTitle>
                                <div className="flex justify-center items-center gap-2 mt-1">
                                    <Badge variant={getFreelancerLevel(selectedFreelancer.id) === 'Top Rated' ? 'default' : 'secondary'}>{t[getFreelancerLevel(selectedFreelancer.id).replace(' ', '').toLowerCase() as keyof typeof t]}</Badge>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-amber-400 fill-amber-400"/>
                                        <span className="font-medium">{getFreelancerRating(selectedFreelancer.id).rating.toFixed(1)}</span>
                                        <span className="text-sm text-muted-foreground">({getFreelancerRating(selectedFreelancer.id).count} {t.reviews})</span>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="py-4 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                            <div className="space-y-1">
                                <h3 className="font-semibold">{t.yourBio}</h3>
                                <p className="text-sm text-muted-foreground">{selectedProfile.bio || t.noBio}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold">{t.skills}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProfile.skills?.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold">{t.myServices}</h3>
                                {selectedProfile.services && selectedProfile.services.length > 0 ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {selectedProfile.services.map(service => (
                                            <Card key={service.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                                <div className="relative aspect-video bg-muted">
                                                    {service.images && service.images.length > 0 ? (
                                                        <Image
                                                            data-ai-hint="portfolio image"
                                                            src={service.images[0]}
                                                            alt={service.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-grow">
                                                    <h4 className="font-semibold text-base line-clamp-2 flex-grow mb-1">{service.title}</h4>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-2 mb-2">
                                                      <Clock className="h-4 w-4" />
                                                      <span>{service.deliveryTime} {t.days}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">{service.description}</p>
                                                </div>
                                                <CardFooter className="flex-col items-stretch">
                                                    <div className="text-right font-bold text-lg mb-2">${service.price.toFixed(2)}+</div>
                                                    <Button size="sm" className="w-full" onClick={() => setRequestingService({ freelancer: selectedFreelancer, service })}>
                                                        {t.requestService}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t.noServicesYet}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" onClick={() => setChattingWith(selectedFreelancer)}>
                                <Contact className="mr-2 h-4 w-4" />
                                {t.contact} {selectedFreelancer.name}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            {chattingWith && (
                <DirectChatDialog
                    otherUser={chattingWith}
                    isOpen={!!chattingWith}
                    onClose={() => setChattingWith(null)}
                />
            )}
            {requestingService && (
                <AlertDialog open={!!requestingService} onOpenChange={(isOpen) => !isOpen && setRequestingService(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.confirmServiceRequest}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t.confirmServiceRequestDesc.replace('{service}', requestingService.service.title).replace('{freelancer}', requestingService.freelancer.name)}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4 space-y-4">
                            <RadioGroup value={selectedDeliveryTier || ''} onValueChange={(value) => setSelectedDeliveryTier(value as 'standard' | 'fast')}>
                                <Label htmlFor="standard-tier" className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted has-[:checked]:border-primary">
                                    <RadioGroupItem value="standard" id="standard-tier" />
                                    <div className="grid gap-1.5 w-full">
                                        <div className="font-semibold">{t.standardDelivery}</div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{requestingService.service.deliveryTime} {t.days}</span>
                                            <span className="font-medium">${requestingService.service.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </Label>
                                {requestingService.service.fastDelivery && (
                                    <Label htmlFor="fast-tier" className="flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted has-[:checked]:border-primary">
                                        <RadioGroupItem value="fast" id="fast-tier" />
                                        <div className="grid gap-1.5 w-full">
                                            <div className="font-semibold text-primary">{t.fastDelivery}</div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{requestingService.service.fastDelivery.days} {t.days}</span>
                                                <span className="font-medium">${requestingService.service.fastDelivery.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </Label>
                                )}
                            </RadioGroup>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleRequestService} 
                                disabled={!selectedDeliveryTier || isSubmittingServiceRequest}
                            >
                                {isSubmittingServiceRequest ? t.processing : t.confirmAndPay}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </main>
    </div>
  );
}
