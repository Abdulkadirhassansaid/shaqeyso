
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { useJobs } from '@/hooks/use-jobs';
import { useReviews } from '@/hooks/use-reviews';
import { useLanguage } from '@/hooks/use-language';
import type { User, FreelancerProfile, Service } from '@/lib/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { Input } from '@/components/ui/input';
import { Search, Star, Contact } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DirectChatDialog } from '@/components/direct-chat-dialog';

type FreelancerLevel = 'New' | 'Rising Talent' | 'Top Rated';

export default function FindFreelancersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { users, isUsersLoading } = useUsers();
  const { jobs, isJobsLoading } = useJobs();
  const { reviews, isReviewsLoading } = useReviews();
  const [freelancerProfiles, setFreelancerProfiles] = React.useState<FreelancerProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = React.useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFreelancer, setSelectedFreelancer] = React.useState<User | null>(null);
  const [chattingWith, setChattingWith] = React.useState<User | null>(null);

  React.useEffect(() => {
    if (!isAuthLoading && user?.role === 'freelancer') {
      router.replace('/');
    }
  }, [user, isAuthLoading, router]);

  React.useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'freelancerProfiles'), (snapshot) => {
        const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as FreelancerProfile));
        setFreelancerProfiles(profilesData);
        setProfilesLoading(false);
    });
    return () => unsub();
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

        return nameMatch || bioMatch || skillMatch;
    });
  }, [freelancers, freelancerProfiles, searchQuery]);
  
  const isLoading = isAuthLoading || isUsersLoading || isJobsLoading || isReviewsLoading || profilesLoading;
  
  const selectedProfile = freelancerProfiles.find(p => p.userId === selectedFreelancer?.id);

  if (!user || user.role === 'freelancer') {
      return null;
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
                
                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFreelancers.length > 0 ? filteredFreelancers.map(f => {
                            const level = getFreelancerLevel(f.id);
                            const { rating, count } = getFreelancerRating(f.id);
                            const profile = freelancerProfiles.find(p => p.userId === f.id);

                            return (
                                <Card key={f.id} className="flex flex-col">
                                    <CardHeader className="text-center items-center">
                                        <Avatar className="h-24 w-24 mb-2">
                                            <AvatarImage src={f.avatarUrl} alt={f.name} />
                                            <AvatarFallback>{f.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <CardTitle>{f.name}</CardTitle>
                                        <Badge variant={level === 'Top Rated' ? 'default' : 'secondary'}>{t[level.replace(' ', '').toLowerCase() as keyof typeof t] || level}</Badge>
                                        <div className="flex items-center gap-1 pt-1">
                                            <StarRating rating={rating} />
                                            <span className="text-sm text-muted-foreground">({count})</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">{profile?.bio || 'No bio available.'}</p>
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
                )}
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
                             <div className="space-y-2">
                                <h3 className="font-semibold">{t.myServices}</h3>
                                <div className="space-y-3">
                                    {selectedProfile.services?.map(service => (
                                        <div key={service.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium">{service.title}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => setChattingWith(selectedFreelancer)}>{t.requestQuote}</Button>
                                            </div>
                                             <div className="text-right font-bold text-primary mt-2">${service.price.toFixed(2)}</div>
                                        </div>
                                    ))}
                                    {(!selectedProfile.services || selectedProfile.services.length === 0) && (
                                        <p className="text-sm text-muted-foreground text-center py-4">{t.noServicesYet}</p>
                                    )}
                                </div>
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
        </main>
    </div>
  );
}
