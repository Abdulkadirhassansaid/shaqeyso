'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Job, User } from '@/lib/types';
import { ArrowLeft, DollarSign, Tag, Clock, Search, Wand2 } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { Badge } from './ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { recommendJobsForFreelancer } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

interface FreelancerDashboardProps {
  user: User;
}

type RecommendedJob = Job & {
    rank: number;
    reason: string;
};

export function FreelancerDashboard({ user }: FreelancerDashboardProps) {
  const { jobs } = useJobs();
  const { freelancerProfiles } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recommendedJobs, setRecommendedJobs] = React.useState<RecommendedJob[]>([]);
  const [isRecommending, setIsRecommending] = React.useState(false);
  const { t } = useLanguage();

  const freelancerProfileData = freelancerProfiles.find(p => p.userId === user.id);
  const profileString = `Skills: ${freelancerProfileData?.skills.join(', ')}. Bio: ${freelancerProfileData?.bio || ''}`;

  const handleGetRecommendations = async () => {
      if (!freelancerProfileData || (freelancerProfileData.skills.length === 0 && !freelancerProfileData.bio)) {
          toast({
              title: t.updateProfileForAITitle,
              description: t.updateProfileForAIDesc,
              variant: 'destructive',
          });
          return;
      }
      
      setIsRecommending(true);
      setRecommendedJobs([]);

      try {
          const openJobs = jobs.filter(job => job.status === 'Open');

          const recommendations = await recommendJobsForFreelancer({
              freelancerProfile: profileString,
              jobs: openJobs
          });

          const sortedRecommendedJobs = recommendations
              .sort((a, b) => b.rank - a.rank)
              .map(rec => {
                  const fullJob = openJobs.find(job => job.id === rec.jobId);
                  return fullJob ? { ...fullJob, rank: rec.rank, reason: rec.reason } : null;
              })
              .filter((job): job is RecommendedJob => job !== null);
          
          setRecommendedJobs(sortedRecommendedJobs);

          if (sortedRecommendedJobs.length === 0) {
              toast({
                  title: t.noRecommendationsTitle,
                  description: t.noRecommendationsDesc
              });
          }

      } catch (error) {
          console.error("Error getting recommendations:", error);
          toast({
              title: t.recommendationFailedTitle,
              description: t.recommendationFailedDesc,
              variant: 'destructive'
          });
      } finally {
          setIsRecommending(false);
      }
  };


  if (selectedJob) {
    return (
      <Card className="w-full">
        <CardHeader>
           <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)} className="justify-start mb-4 w-fit px-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToJobs}
          </Button>
          <CardTitle className="font-headline text-2xl md:text-3xl">{selectedJob.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-muted-foreground">
             <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{t.budget}: ${selectedJob.budget}</span>
             </div>
             <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <Badge variant="secondary">{selectedJob.category}</Badge>
             </div>
             <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{t.deadline}: {selectedJob.deadline}</span>
             </div>
          </div>
        </CardHeader>
        <CardContent>
            <h3 className='font-semibold mb-2'>{t.jobDescriptionTitle}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
        </CardContent>
        <CardFooter className='flex-col items-start gap-6'>
            <ProposalForm job={selectedJob} freelancerProfile={profileString} />
        </CardFooter>
      </Card>
    );
  }

  const openJobs = jobs.filter(job => job.status === 'Open');
  const filteredJobs = openJobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Tabs defaultValue="all-jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-jobs">{t.allJobs}</TabsTrigger>
            <TabsTrigger value="for-you">{t.forYou} <Wand2 className="ml-2 h-4 w-4 text-accent-foreground/80" /></TabsTrigger>
        </TabsList>
        <TabsContent value="all-jobs">
            <Card>
                <CardHeader>
                    <CardTitle>{t.findWork}</CardTitle>
                    <CardDescription>{t.findWorkDesc}</CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t.searchJobsPlaceholder} 
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg font-headline">{job.title}</CardTitle>
                                <div className="flex items-center gap-2 pt-1">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <Badge variant="secondary">{job.category}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                            </CardContent>
                            <CardFooter className='flex-col items-start gap-4'>
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <DollarSign className="h-5 w-5 text-green-500" />
                                    <span>${job.budget}</span>
                                </div>
                                <Button className="w-full" onClick={() => setSelectedJob(job)}>{t.viewAndApply}</Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {filteredJobs.length === 0 && (
                        <p className="text-muted-foreground text-center py-4 md:col-span-2 lg:col-span-3">{t.noJobsFound}</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="for-you">
             <Card>
                <CardHeader>
                    <CardTitle>{t.recommendedForYou}</CardTitle>
                    <CardDescription>{t.recommendedForYouDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleGetRecommendations} disabled={isRecommending}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isRecommending ? t.gettingRecommendations : t.getRecommendations}
                    </Button>
                    
                    {isRecommending && (
                        <div className="space-y-4">
                           <Skeleton className="h-48 w-full" />
                           <Skeleton className="h-48 w-full" />
                        </div>
                    )}
                    
                    {recommendedJobs.length > 0 && !isRecommending && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {recommendedJobs.map(job => (
                                <Card key={job.id} className="flex flex-col bg-secondary">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-headline">{job.title}</CardTitle>
                                            <Badge variant="default">{`Rank: ${job.rank}/10`}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <Badge variant="outline">{job.category}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                                        <div>
                                            <p className="text-sm font-semibold">{t.matchReason}:</p>
                                            <p className="text-sm text-muted-foreground italic">"{job.reason}"</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className='flex-col items-start gap-4'>
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <DollarSign className="h-5 w-5 text-green-500" />
                                            <span>${job.budget}</span>
                                        </div>
                                        <Button className="w-full" onClick={() => setSelectedJob(job)}>{t.viewAndApply}</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                    
                    {!isRecommending && recommendedJobs.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">{t.clickToGetRecommendations}</p>
                    )}
                </CardContent>
             </Card>
        </TabsContent>
    </Tabs>
  );
}
