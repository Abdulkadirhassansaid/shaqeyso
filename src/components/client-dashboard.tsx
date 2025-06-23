
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Job, User, Proposal, RankedFreelancer } from '@/lib/types';
import { JobPostForm } from './job-post-form';
import { ArrowLeft, Users, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { rankMatchingFreelancers } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { mockProposals } from '@/lib/mock-data';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface ClientDashboardProps {
  user: User;
}

export function ClientDashboard({ user }: ClientDashboardProps) {
  const { jobs, deleteJob, updateJobStatus } = useJobs();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [rankedFreelancers, setRankedFreelancers] = React.useState<RankedFreelancer[]>([]);
  const [isRanking, setIsRanking] = React.useState(false);
  const { toast } = useToast();
  const { users: allUsers, freelancerProfiles } = useAuth();
  const { t } = useLanguage();

  const clientJobs = jobs.filter((job) => job.clientId === user.id);

  const handleRankFreelancers = async (job: Job) => {
    setIsRanking(true);
    setRankedFreelancers([]);
    try {
      const jobProposals = mockProposals.filter(p => p.jobId === job.id);
      if (jobProposals.length === 0) {
        toast({
            variant: "destructive",
            title: t.noProposalsToRank,
            description: t.noProposalsToRankDesc,
        });
        return;
      }
      
      const freelancerProfilesWithProposals = jobProposals.map(proposal => {
        const profile = freelancerProfiles.find(p => p.userId === proposal.freelancerId);
        return {
            profile: `Skills: ${profile?.skills.join(', ')}. Bio: ${profile?.bio}`,
            proposal: proposal.coverLetter,
        }
      });

      const result = await rankMatchingFreelancers({
        jobDescription: job.description,
        freelancerProfiles: freelancerProfilesWithProposals,
      });
      setRankedFreelancers(result.sort((a, b) => b.rank - a.rank));
    } catch (error) {
      console.error('Error ranking freelancers:', error);
      toast({
        variant: "destructive",
        title: t.rankingFailed,
        description: t.rankingFailedDesc,
      });
    } finally {
      setIsRanking(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    await deleteJob(jobId);
    toast({
        title: t.jobDeleted,
        description: t.jobDeletedDesc,
    });
  };

  const handleUpdateStatus = async (jobId: string, status: Job['status']) => {
      await updateJobStatus(jobId, status);
      toast({
          title: t.jobStatusUpdated,
          description: t.jobStatusUpdatedDesc,
      });
  };
  
  if (selectedJob) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedJob(null); setRankedFreelancers([]); }} className="justify-start mb-4 w-fit px-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToJobs}
          </Button>
          <CardTitle>{selectedJob.title}</CardTitle>
          <CardDescription>
            {selectedJob.category} - {t.budget}: ${selectedJob.budget}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5" /> {t.proposals}</h3>
                <Button onClick={() => handleRankFreelancers(selectedJob)} disabled={isRanking}>
                    {isRanking ? t.ranking : t.findBestMatches}
                </Button>
            </div>
            
            {isRanking && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            )}
            
            {rankedFreelancers.length > 0 ? (
                <div className="space-y-4">
                    {rankedFreelancers.map((freelancer, index) => (
                        <Card key={index} className="bg-secondary">
                            <CardHeader className='flex-row items-start gap-4'>
                                <Badge variant="default" className="text-lg h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                                  #{freelancer.rank}
                                </Badge>
                                <div>
                                <CardTitle className="text-base">{t.topMatch}</CardTitle>
                                <CardDescription>{t.reasoning}: {freelancer.reason}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-semibold">{t.proposal}</p>
                                <p className="text-sm text-muted-foreground italic">"{freelancer.proposal}"</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 mockProposals.filter(p => p.jobId === selectedJob.id).length > 0 ? (
                    <div className="space-y-4">
                        {mockProposals.filter(p => p.jobId === selectedJob.id).map(proposal => {
                            const freelancerUser = allUsers.find(u => u.id === proposal.freelancerId);
                            return (
                                <Card key={proposal.id}>
                                    <CardHeader className='flex-row items-center gap-4'>
                                        <Avatar>
                                            <AvatarImage src={freelancerUser?.avatarUrl} alt={freelancerUser?.name} />
                                            <AvatarFallback>{freelancerUser?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{freelancerUser?.name}</p>
                                            <p className="text-sm text-muted-foreground">{t.proposedRate}: ${proposal.proposedRate}/hr</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{proposal.coverLetter}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button size="sm">{t.hireFreelancer}</Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>{t.noProposals}</p>
                    </div>
                 )
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="my-jobs" className="w-full">
      <TabsList>
        <TabsTrigger value="my-jobs">{t.myJobPostings}</TabsTrigger>
        <TabsTrigger value="post-job">{t.postNewJob}</TabsTrigger>
      </TabsList>
      <TabsContent value="my-jobs" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.myJobPostings}</CardTitle>
            <CardDescription>
              {t.clientJobDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientJobs.map((job) => {
              const status = job.status || 'Open';
              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>
                          {t.budget}: ${job.budget}
                        </CardDescription>
                      </div>
                      <Badge variant={status === 'Open' ? 'default' : status === 'Closed' ? 'destructive' : 'secondary'}>{t[status.toLowerCase() as keyof typeof t] || status}</Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center">
                    <Button onClick={() => setSelectedJob(job)}>
                      {t.viewDetailsAndProposals}
                    </Button>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">{t.actions}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>{t.changeStatus}</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem disabled={status === 'Open'} onClick={() => handleUpdateStatus(job.id, 'Open')}>{t.open}</DropdownMenuItem>
                                <DropdownMenuItem disabled={status === 'Interviewing'} onClick={() => handleUpdateStatus(job.id, 'Interviewing')}>{t.interviewing}</DropdownMenuItem>
                                <DropdownMenuItem disabled={status === 'Closed'} onClick={() => handleUpdateStatus(job.id, 'Closed')}>{t.closed}</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              {t.deleteJob}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.deleteJobConfirmTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t.deleteJobConfirmDesc}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90">{t.delete}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              );
            })}
            {clientJobs.length === 0 && (
              <p className="text-muted-foreground text-center py-4">{t.noJobsPosted}</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="post-job" className="mt-6">
        <JobPostForm />
      </TabsContent>
    </Tabs>
  );
}
