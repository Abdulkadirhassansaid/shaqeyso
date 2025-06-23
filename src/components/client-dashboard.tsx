
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Job, User, Proposal, RankedFreelancer } from '@/lib/types';
import { JobPostForm } from './job-post-form';
import { ArrowLeft, Users, MoreVertical, Edit, UserCheck, CheckCircle, MessageSquare, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { rankMatchingFreelancers } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProposals } from '@/hooks/use-proposals';
import { ChatDialog } from './chat-dialog';
import { ApprovePaymentDialog } from './approve-payment-dialog';


interface ClientDashboardProps {
  user: User;
}

export function ClientDashboard({ user }: ClientDashboardProps) {
  const { jobs, deleteJob, updateJobStatus, hireFreelancerForJob, releasePayment } = useJobs();
  const { proposals, acceptProposal } = useProposals();
  const [activeTab, setActiveTab] = React.useState('my-jobs');
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [editingJob, setEditingJob] = React.useState<Job | null>(null);
  const [rankedFreelancers, setRankedFreelancers] = React.useState<RankedFreelancer[]>([]);
  const [isRanking, setIsRanking] = React.useState(false);
  const { toast } = useToast();
  const { users: allUsers, freelancerProfiles, addTransaction } = useAuth();
  const { t } = useLanguage();
  const [proposalToHire, setProposalToHire] = React.useState<Proposal | null>(null);
  const [jobToChat, setJobToChat] = React.useState<Job | null>(null);

  const clientJobs = jobs.filter((job) => job.clientId === user.id);

  React.useEffect(() => {
    if (selectedJob) {
        const freshJobData = jobs.find(j => j.id === selectedJob.id);
        // Use stringify to prevent infinite re-renders from object comparison
        if (freshJobData && JSON.stringify(freshJobData) !== JSON.stringify(selectedJob)) {
            setSelectedJob(freshJobData);
        }
    }
  }, [jobs, selectedJob]);
  
  const handleHireFreelancer = async () => {
    if (!proposalToHire) return;

    const jobToHire = jobs.find(j => j.id === proposalToHire.jobId);
    if (!jobToHire) return;

    if ((user.balance || 0) < jobToHire.budget) {
        toast({
            title: t.insufficientFundsTitle,
            description: t.insufficientFundsDesc,
            variant: "destructive",
        });
        return;
    }

    // Move funds to escrow
    await addTransaction(user.id, {
        description: `${t.escrowFunding} "${jobToHire.title}"`,
        amount: -jobToHire.budget,
        status: 'Completed',
    });

    await hireFreelancerForJob(proposalToHire.jobId, proposalToHire.freelancerId);
    await acceptProposal(proposalToHire.id, proposalToHire.jobId);

    toast({
        title: t.freelancerHired,
        description: t.freelancerHiredDesc,
    });
    setProposalToHire(null);
    setSelectedJob(null);
    setRankedFreelancers([]);
  };

  const handleStartInterview = async () => {
    if (!proposalToHire) return;
    const jobId = proposalToHire.jobId;

    await updateJobStatus(jobId, 'Interviewing');

    toast({
        title: t.interviewProcessStarted,
        description: t.interviewProcessStartedDesc,
    });
    
    setProposalToHire(null);
  };
  
  const handleApproveAndPay = async (jobId: string) => {
    const jobToApprove = jobs.find(j => j.id === jobId);
    if (!jobToApprove || !jobToApprove.hiredFreelancerId) return;

    await releasePayment(jobToApprove.id);
    
    // 2. Release funds from escrow to freelancer
    const paymentDescription = `${t.paymentReceivedFromEscrow} "${jobToApprove.title}"`;
    await addTransaction(jobToApprove.hiredFreelancerId, {
        description: paymentDescription,
        amount: jobToApprove.budget,
        status: 'Completed',
    });

    toast({
        title: t.paymentComplete,
        description: t.paymentCompleteDesc,
    });
  };

  const handleRankFreelancers = async (job: Job) => {
    setIsRanking(true);
    setRankedFreelancers([]);
    try {
      const jobProposals = proposals.filter(p => p.jobId === job.id);
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

      const rankedWithOriginals = result.map(ranked => {
          const originalProposal = proposals.find(p => p.jobId === job.id && p.coverLetter === ranked.proposal);
          return { ...ranked, originalProposal };
      }).filter((item): item is RankedFreelancer => !!item.originalProposal);


      setRankedFreelancers(rankedWithOriginals.sort((a, b) => b.rank - a.rank));
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

  const getStatusVariant = (status: Job['status']) => {
    switch (status) {
        case 'Open': return 'default';
        case 'Completed': return 'default';
        default: return 'secondary';
    }
  };

  if (editingJob) {
      return (
          <JobPostForm 
              jobToEdit={editingJob} 
              onFinished={() => setEditingJob(null)} 
          />
      );
  }
  
  if (selectedJob) {
    const jobProposals = proposals.filter(p => p.jobId === selectedJob.id);
    const hiredFreelancer = allUsers.find(u => u.id === selectedJob.hiredFreelancerId);
    
    const ProposalCard = ({ proposal, isRanked = false, rank, reason }: { proposal: Proposal, isRanked?: boolean, rank?: number, reason?: string }) => {
        const freelancerUser = allUsers.find(u => u.id === proposal.freelancerId);
        const proposalStatus = proposal.status || 'Pending';
        const statusVariant = proposalStatus === 'Accepted' ? 'default' : proposalStatus === 'Rejected' ? 'destructive' : 'secondary';
        
        return (
            <Card className={isRanked ? "bg-secondary" : ""}>
                <CardHeader className='flex-row items-start gap-4'>
                    {isRanked && rank && (
                        <Badge variant="default" className="text-lg h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                          #{rank}
                        </Badge>
                    )}
                    <Avatar>
                        <AvatarImage src={freelancerUser?.avatarUrl} alt={freelancerUser?.name} />
                        <AvatarFallback>{freelancerUser?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">{freelancerUser?.name}</p>
                            <Badge variant={statusVariant}>{t[proposalStatus.toLowerCase() as keyof typeof t] || proposalStatus}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.proposedRate}: ${proposal.proposedRate}/hr</p>
                        {isRanked && reason && <CardDescription className="pt-1">{t.reasoning}: {reason}</CardDescription>}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">"{proposal.coverLetter}"</p>
                </CardContent>
                {(selectedJob?.status === 'Open' || selectedJob?.status === 'Interviewing') && (
                    <CardFooter>
                         <Button size="sm" onClick={() => setProposalToHire(proposal)}>{t.hireFreelancer}</Button>
                    </CardFooter>
                )}
            </Card>
        );
    };

    return (
      <AlertDialog open={!!proposalToHire} onOpenChange={(isOpen) => !isOpen && setProposalToHire(null)}>
          <Card className="w-full">
              <CardHeader>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedJob(null); setRankedFreelancers([]); }} className="justify-start mb-4 w-fit px-2">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t.backToJobs}
                  </Button>
                  <div className="flex justify-between items-center">
                      <CardTitle>{selectedJob.title}</CardTitle>
                  </div>
                  <CardDescription>
                      {selectedJob.category} - {t.budget}: ${selectedJob.budget}
                  </CardDescription>
              </CardHeader>
              <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
              
              <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5" /> {t.proposals}</h3>
                      {selectedJob.status === 'Open' && (
                           <Button onClick={() => handleRankFreelancers(selectedJob)} disabled={isRanking}>
                              {isRanking ? t.ranking : t.findBestMatches}
                          </Button>
                      )}
                  </div>
                  
                  {isRanking && (
                      <div className="space-y-4">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                      </div>
                  )}
                  
                  {rankedFreelancers.length > 0 ? (
                      <div className="space-y-4">
                          {rankedFreelancers.map((freelancer) => (
                              <ProposalCard 
                                  key={freelancer.originalProposal.id} 
                                  proposal={freelancer.originalProposal}
                                  isRanked={true}
                                  rank={freelancer.rank}
                                  reason={freelancer.reason}
                              />
                          ))}
                      </div>
                  ) : (
                      jobProposals.length > 0 ? (
                          <div className="space-y-4">
                              {jobProposals.map(proposal => (
                                  <ProposalCard key={proposal.id} proposal={proposal} />
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-8 text-muted-foreground">
                              <p>{t.noProposals}</p>
                          </div>
                      )
                  )}
              </div>
              </CardContent>
              {selectedJob.status === 'InProgress' && hiredFreelancer && (
                  <CardFooter>
                      <ApprovePaymentDialog
                          job={selectedJob}
                          freelancer={hiredFreelancer}
                          onConfirm={() => handleApproveAndPay(selectedJob.id)}
                      >
                          <Button>{t.approveAndPay}</Button>
                      </ApprovePaymentDialog>
                  </CardFooter>
              )}
          </Card>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t.chooseNextStep}</AlertDialogTitle>
                  <AlertDialogDescription>
                      {proposalToHire && t.nextStepDesc(allUsers.find(u => u.id === proposalToHire.freelancerId)?.name || 'this freelancer')}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setProposalToHire(null)}>{t.cancel}</AlertDialogCancel>
                  <Button variant="secondary" onClick={handleStartInterview}>{t.startInterview}</Button>
                  <AlertDialogAction onClick={handleHireFreelancer}>{t.hireDirectly}</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              const hiredFreelancer = job.hiredFreelancerId ? allUsers.find(u => u.id === job.hiredFreelancerId) : undefined;
              const canEdit = status === 'Open' || status === 'Interviewing';

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
                      <Badge variant={getStatusVariant(status)}>{t[status.toLowerCase() as keyof typeof t] || status}</Badge>
                      </div>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-wrap">
                         <Button onClick={() => setSelectedJob(job)}>{t.viewDetailsAndProposals}</Button>
                         {job.status === 'InProgress' && hiredFreelancer && (
                              <Button variant="outline" onClick={() => setJobToChat(job)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  {t.chatWith} {hiredFreelancer.name}
                              </Button>
                          )}

                           {status === 'InProgress' && hiredFreelancer && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <ShieldCheck className="h-5 w-5 text-green-600" />
                                  <span>${job.budget.toFixed(2)} {t.inEscrow}</span>
                              </div>
                          )}
                          {status === 'Completed' && hiredFreelancer && (
                              <div className="flex items-center text-sm text-green-500 gap-2">
                                  <CheckCircle className="h-5 w-5"/>
                                  <span>{t.paidTo} <span className="font-semibold">{hiredFreelancer.name}</span></span>
                              </div>
                          )}
                      </div>

                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">{t.actions}</span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingJob(job)} disabled={!canEdit}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>{t.editJob}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                              <DropdownMenuSubTrigger disabled={status === 'Completed'}>{t.changeStatus}</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                  <DropdownMenuItem disabled={status === 'Open'} onClick={() => handleUpdateStatus(job.id, 'Open')}>{t.open}</DropdownMenuItem>
                                  <DropdownMenuItem disabled={status === 'Interviewing'} onClick={() => handleUpdateStatus(job.id, 'Interviewing')}>{t.interviewing}</DropdownMenuItem>
                              </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={!canEdit}>
                                  {t.deleteJob}
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>{t.deleteJobConfirmTitle}</AlertDialogTitle>
                                      <AlertDialogDescription>{t.deleteJobConfirmDesc}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90">{t.delete}</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                          </DropdownMenuContent>
                      </DropdownMenu>
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
          <JobPostForm onFinished={() => setActiveTab('my-jobs')} />
      </TabsContent>
      </Tabs>
      {jobToChat && (
          <ChatDialog 
              job={jobToChat}
              isOpen={!!jobToChat}
              onClose={() => setJobToChat(null)}
          />
      )}
    </>
  );
}
