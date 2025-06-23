
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
import { ArrowLeft, DollarSign, Tag, Clock, Search, Wand2, CheckCircle, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { Badge } from './ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { recommendJobsForFreelancer } from '@/app/actions';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { LoadingDots } from './loading-dots';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChatDialog } from './chat-dialog';
import { ReviewFormDialog } from './review-form-dialog';
import { useReviews } from '@/hooks/use-reviews';


interface FreelancerDashboardProps {
  user: User;
}

type RecommendedJob = Job & {
    rank: number;
    reason: string;
};

export function FreelancerDashboard({ user }: FreelancerDashboardProps) {
  const { jobs, markJobAsReviewed } = useJobs();
  const { freelancerProfiles, users: allUsers } = useAuth();
  const { toast } = useToast();
  const { addReview } = useReviews();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recommendedJobs, setRecommendedJobs] = React.useState<RecommendedJob[]>([]);
  const [isRecommending, setIsRecommending] = React.useState(false);
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState('find-work');
  const [jobToChat, setJobToChat] = React.useState<Job | null>(null);
  const [jobToReview, setJobToReview] = React.useState<Job | null>(null);


  const freelancerProfileData = freelancerProfiles.find(p => p.userId === user.id);
  const profileString = `Skills: ${freelancerProfileData?.skills.join(', ')}. Bio: ${freelancerProfileData?.bio || ''}`;

  const handleGetRecommendations = React.useCallback(async () => {
      if (!freelancerProfileData || (freelancerProfileData.skills.length === 0 && !freelancerProfileData.bio)) {
          // Silently fail if profile is not complete
          return;
      }
      
      setIsRecommending(true);

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

      } catch (error) {
          console.error("Error getting recommendations:", error);
          // Don't show a toast for background failure, just log it.
      } finally {
          setIsRecommending(false);
      }
  }, [freelancerProfileData, jobs, profileString]);

  React.useEffect(() => {
    handleGetRecommendations();
  }, [handleGetRecommendations]);

  const handleReviewSubmit = async (jobId: string, revieweeId: string, rating: number, comment: string) => {
      await addReview({
          jobId,
          reviewerId: user.id,
          revieweeId,
          rating,
          comment
      });
      await markJobAsReviewed(jobId, 'freelancer');
      toast({ title: t.reviewSubmissionSuccess, description: t.reviewSubmissionSuccessDesc });
      setJobToReview(null);
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
            <ProposalForm 
                job={selectedJob} 
                freelancerProfile={profileString} 
                onFinished={() => setSelectedJob(null)}
            />
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
  
  const myProjects = jobs.filter(job => job.hiredFreelancerId === user.id && ['InProgress', 'Completed'].includes(job.status));


  const renderFindWorkContent = () => {
    if (openJobs.length === 0) {
      return <p className="text-muted-foreground text-center py-8">{t.noOpenJobsAvailable}</p>;
    }

    if (filteredJobs.length === 0) {
      return <p className="text-muted-foreground text-center py-8">{t.noJobsFound}</p>;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => {
            const recommendation = recommendedJobs.find(rec => rec.id === job.id);
            const isRecommended = !!recommendation;
            
            return (
                <Card key={job.id} className={cn("flex flex-col transition-all", isRecommended && "border-primary/50 bg-primary/5")}>
                    <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-lg font-headline">{job.title}</CardTitle>
                            {isRecommended && (
                                <Badge variant="default" className="shrink-0">
                                    <Wand2 className="mr-1.5 h-3 w-3" />
                                    {t.forYou}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <Badge variant={isRecommended ? "outline" : "secondary"}>{job.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                         {isRecommended && (
                            <div>
                                <p className="text-sm font-semibold">{t.matchReason}:</p>
                                <p className="text-sm text-muted-foreground italic">"{recommendation.reason}"</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className='flex-col items-start gap-4'>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            <span>${job.budget}</span>
                        </div>
                        <Button className="w-full" onClick={() => setSelectedJob(job)}>{t.viewAndApply}</Button>
                    </CardFooter>
                </Card>
            );
        })}
      </div>
    );
  };
  
  const renderMyProjectsContent = () => {
    if (myProjects.length === 0) {
        return <p className="text-muted-foreground text-center py-8">{t.noActiveProjects}</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {myProjects.map(job => {
                const client = allUsers.find(u => u.id === job.clientId);
                return (
                    <Card key={job.id}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge variant={job.status === 'Completed' ? 'default' : 'secondary'}>
                              {t[job.status.toLowerCase() as keyof typeof t] || job.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                {client && <p className="font-medium">{t.client}: {client.name}</p>}
                                {job.status === 'InProgress' && (
                                    <div className="flex items-center text-green-600 gap-2 font-medium">
                                        <ShieldCheck className="h-4 w-4"/>
                                        <span>${job.budget.toFixed(2)} {t.inEscrow}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-2">
                            {job.status === 'Completed' && (
                                <div className="flex flex-col items-stretch gap-2 w-full p-2 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center text-sm text-green-500 gap-2">
                                        <CheckCircle className="h-5 w-5"/>
                                        <span>{t.projectCompletedAndPaid}</span>
                                    </div>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => setJobToReview(job)}
                                        disabled={job.freelancerReviewed}
                                    >
                                        <Star className="mr-2 h-4 w-4" />
                                        {job.freelancerReviewed ? t.reviewSubmitted : t.leaveReview}
                                    </Button>
                                </div>
                            )}
                            <Button className="w-full" variant="outline" onClick={() => setJobToChat(job)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                {t.chatWithClient}
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
  }

  return (
    <>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="find-work">{t.findWork}</TabsTrigger>
                <TabsTrigger value="my-projects">{t.myProjects}</TabsTrigger>
            </TabsList>
            <TabsContent value="find-work" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>{t.findWork}</CardTitle>
                            <CardDescription>{t.findWorkDesc}</CardDescription>
                        </div>
                        <div className="relative md:w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder={t.searchJobsPlaceholder}
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        </div>
                        {isRecommending && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                            <Wand2 className="h-4 w-4" />
                            <span>{t.gettingRecommendations}</span>
                        </div>
                        )}
                    </CardHeader>
                    <CardContent>{renderFindWorkContent()}</CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="my-projects" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.myProjects}</CardTitle>
                        <CardDescription>{t.myProjectsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>{renderMyProjectsContent()}</CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {jobToChat && (
            <ChatDialog
                job={jobToChat}
                isOpen={!!jobToChat}
                onClose={() => setJobToChat(null)}
            />
        )}
        {jobToReview && (
            <ReviewFormDialog
                isOpen={!!jobToReview}
                onClose={() => setJobToReview(null)}
                reviewee={allUsers.find(u => u.id === jobToReview.clientId)}
                job={jobToReview}
                onSubmit={handleReviewSubmit}
            />
        )}
    </>
  );
}
