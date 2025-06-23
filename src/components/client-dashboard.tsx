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
import { ArrowLeft, Award, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { rankMatchingFreelancers } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { mockProposals, mockFreelancerProfiles } from '@/lib/mock-data';
import { Skeleton } from './ui/skeleton';

interface ClientDashboardProps {
  user: User;
  jobs: Job[];
}

export function ClientDashboard({ user, jobs: initialJobs }: ClientDashboardProps) {
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [rankedFreelancers, setRankedFreelancers] = React.useState<RankedFreelancer[]>([]);
  const [isRanking, setIsRanking] = React.useState(false);
  const { toast } = useToast();

  const clientJobs = initialJobs.filter((job) => job.clientId === user.id);

  const handleRankFreelancers = async (job: Job) => {
    setIsRanking(true);
    setRankedFreelancers([]);
    try {
      const jobProposals = mockProposals.filter(p => p.jobId === job.id);
      if (jobProposals.length === 0) {
        toast({
            variant: "destructive",
            title: "No Proposals",
            description: "There are no proposals for this job yet to rank freelancers.",
        });
        return;
      }
      
      const freelancerProfilesWithProposals = jobProposals.map(proposal => {
        const profile = mockFreelancerProfiles.find(p => p.userId === proposal.freelancerId);
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
        title: "Ranking Failed",
        description: "Could not rank freelancers at this time.",
      });
    } finally {
      setIsRanking(false);
    }
  };
  
  if (selectedJob) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedJob(null); setRankedFreelancers([]); }} className="justify-start mb-4 w-fit px-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
          <CardTitle>{selectedJob.title}</CardTitle>
          <CardDescription>
            {selectedJob.category} - Budget: ${selectedJob.budget}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5" /> Proposals</h3>
                <Button onClick={() => handleRankFreelancers(selectedJob)} disabled={isRanking}>
                    {isRanking ? 'Ranking...' : 'Find Best Matches (AI)'}
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
                                <CardTitle className="text-base">Top Match</CardTitle>
                                <CardDescription>Reasoning: {freelancer.reason}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-semibold">Proposal:</p>
                                <p className="text-sm text-muted-foreground italic">"{freelancer.proposal}"</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 mockProposals.filter(p => p.jobId === selectedJob.id).length > 0 ? (
                    <div className="space-y-4">
                        {mockProposals.filter(p => p.jobId === selectedJob.id).map(proposal => {
                            const freelancer = mockUsers.find(u => u.id === proposal.freelancerId);
                            return (
                                <Card key={proposal.id}>
                                    <CardHeader className='flex-row items-center gap-4'>
                                        <Avatar>
                                            <AvatarImage src={freelancer?.avatarUrl} alt={freelancer?.name} />
                                            <AvatarFallback>{freelancer?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{freelancer?.name}</p>
                                            <p className="text-sm text-muted-foreground">Proposed Rate: ${proposal.proposedRate}/hr</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{proposal.coverLetter}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button size="sm">Hire Freelancer</Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                 ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No proposals submitted yet.</p>
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
        <TabsTrigger value="my-jobs">My Job Postings</TabsTrigger>
        <TabsTrigger value="post-job">Post a New Job</TabsTrigger>
      </TabsList>
      <TabsContent value="my-jobs" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>My Job Postings</CardTitle>
            <CardDescription>
              Here are the jobs you've posted. Click on a job to see proposals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription>
                    Budget: ${job.budget}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => setSelectedJob(job)}>
                    View Details & Proposals
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {clientJobs.length === 0 && (
              <p className="text-muted-foreground text-center py-4">You haven't posted any jobs yet.</p>
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
