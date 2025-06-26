
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { Job, User, Proposal, RankedFreelancer, FreelancerProfile } from '@/lib/types';
import { JobPostForm } from './job-post-form';
import { ArrowLeft, Users, MoreVertical, Edit, UserCheck, CheckCircle, MessageSquare, ShieldCheck, Star, AlertCircle, Search, Wand2, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { rankMatchingFreelancers } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProposals } from '@/hooks/use-proposals';
import { ApprovePaymentDialog } from './approve-payment-dialog';
import { ReviewFormDialog } from './review-form-dialog';
import { useReviews } from '@/hooks/use-reviews';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { collection, onSnapshot, doc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUsers } from '@/hooks/use-users';
import { LoadingDots } from './loading-dots';
import { useChat } from '@/hooks/use-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function ClientDashboard() {
  const { user } = useAuth();
  const { jobs, deleteJob, updateJobStatus, hireFreelancerForJob, markJobAsReviewed } = useJobs();
  const { proposals, acceptProposal } = useProposals();
  const { addReview } = useReviews();
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const [editingJob, setEditingJob] = React.useState<Job | null>(null);
  const [jobToReview, setJobToReview] = React.useState<Job | null>(null);
  const [rankedFreelancers, setRankedFreelancers] = React.useState<RankedFreelancer[]>([]);
  const [isRanking, setIsRanking] = React.useState(false);
  const { toast } = useToast();
  const { users: allUsers, isUsersLoading } = useUsers();
  const { t } = useLanguage();
  const [proposalToHire, setProposalToHire] = React.useState<Proposal | null>(null);
  const { openChat } = useChat();
  const [freelancerProfiles, setFreelancerProfiles] = React.useState<FreelancerProfile[]>([]);
  const [isPostJobOpen, setIsPostJobOpen] = React.useState(false);

  React.useEffect(() => {
    if (!db) return;
    const fetchProfiles = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'freelancerProfiles'));
            const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as FreelancerProfile));
            setFreelancerProfiles(profilesData);
        } catch (error) {
            console.error("Error fetching freelancer profiles for dashboard:", error);
        }
    };
    fetchProfiles();
  }, []);

  if (!user) {
    return null;
  }

  const clientJobs = jobs.filter((job) => job.clientId === user.id);
  const manualJobs = clientJobs.filter(job => !job.sourceServiceId);
  const serviceOrderJobs = clientJobs.filter(job => !!job.sourceServiceId);
  
  const handleHireFreelancer = async () => {
    if (!proposalToHire || !user || !db) return;
  
    const jobToHire = jobs.find(j => j.id === proposalToHire.jobId);
    if (!jobToHire) return;
  
    const clientBalance = (user.transactions || []).reduce((acc, tx) => acc + (tx.amount || 0), 0);
  
    if (clientBalance < (jobToHire.budget || 0)) {
      toast({
        title: t.insufficientFundsTitle,
        description: t.insufficientFundsDesc,
        variant: "destructive",
      });
      setProposalToHire(null);
      return;
    }
  
    const adminUser = allUsers.find(u => u.role === 'admin');
    if (!adminUser) {
        toast({ title: "Error", description: "Admin account not found. Cannot process payment.", variant: "destructive" });
        setProposalToHire(null);
        return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, 'users', user.id);
        const adminRef = doc(db, 'users', adminUser.id);
        
        const clientDoc = await transaction.get(clientRef);
        const adminDoc = await transaction.get(adminRef);

        if (!clientDoc.exists() || !adminDoc.exists()) {
          throw new Error("User or admin document not found!");
        }

        // Debit client
        const clientTransactions = clientDoc.data().transactions || [];
        const newClientTransactions = [...clientTransactions, {
          id: `txn-client-${Date.now()}`,
          date: new Date().toISOString(),
          description: `${t.escrowFunding} "${jobToHire.title}"`,
          amount: -(jobToHire.budget || 0),
          status: 'Completed',
        }];
        transaction.update(clientRef, { transactions: newClientTransactions });

        // Credit admin for escrow
        const adminTransactions = adminDoc.data().transactions || [];
        const newAdminTransactions = [...adminTransactions, {
          id: `txn-escrow-${Date.now()}`,
          date: new Date().toISOString(),
          description: `Escrow for job: "${jobToHire.title}"`,
          amount: (jobToHire.budget || 0),
          status: 'Completed'
        }];
        transaction.update(adminRef, { transactions: newAdminTransactions });
      });
      
      await hireFreelancerForJob(proposalToHire.jobId, proposalToHire.freelancerId);
      await acceptProposal(proposalToHire.id, proposalToHire.jobId);
  
      toast({
        title: t.freelancerHired,
        description: t.freelancerHiredDesc,
      });
  
      setProposalToHire(null);
      setSelectedJobId(null);
      setRankedFreelancers([]);
  
    } catch (error) {
      console.error("Error during hiring process:", error);
      toast({
        title: "Hiring Failed",
        description: "An error occurred while trying to hire the freelancer.",
        variant: "destructive"
      });
      setProposalToHire(null);
    }
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
    if (!db) return;
    const jobToApprove = jobs.find(j => j.id === jobId);
    if (!jobToApprove || !jobToApprove.hiredFreelancerId) return;
  
    const adminUser = allUsers.find(u => u.role === 'admin');
    if (!adminUser) {
      toast({ title: "Error", description: "Admin account not found. Could not process payment.", variant: "destructive" });
      return;
    }
  
    try {
      await runTransaction(db, async (transaction) => {
        const jobRef = doc(db, 'jobs', jobToApprove.id);
        const freelancerRef = doc(db, 'users', jobToApprove.hiredFreelancerId!);
        const adminRef = doc(db, 'users', adminUser.id);
  
        const freelancerDoc = await transaction.get(freelancerRef);
        const adminDoc = await transaction.get(adminRef);
  
        if (!freelancerDoc.exists() || !adminDoc.exists()) {
          throw new Error("User or Admin document not found!");
        }
  
        const budget = jobToApprove.budget || 0;
        const platformFee = budget * 0.05;
        const freelancerPayout = budget - platformFee;
  
        const currentFreelancerTransactions = freelancerDoc.data().transactions || [];
        const payoutTx = {
            id: `txn-payout-${Date.now()}`,
            date: new Date().toISOString(),
            description: `${t.paymentReceivedFromEscrow} "${jobToApprove.title}"`,
            amount: freelancerPayout,
            status: 'Completed' as const,
        };
  
        const currentAdminTransactions = adminDoc.data().transactions || [];
        const releaseTx = {
            id: `txn-release-${Date.now()}`,
            date: new Date().toISOString(),
            description: `Release escrow for "${jobToApprove.title}"`,
            amount: -budget,
            status: 'Completed' as const,
        };
        const feeTx = {
            id: `txn-fee-${Date.now()}`,
            date: new Date().toISOString(),
            description: `${t.platformFee} for "${jobToApprove.title}"`,
            amount: platformFee,
            status: 'Completed' as const,
        };
        
        transaction.update(jobRef, { status: 'Completed' });
        transaction.update(freelancerRef, { transactions: [...currentFreelancerTransactions, payoutTx] });
        transaction.update(adminRef, { transactions: [...currentAdminTransactions, releaseTx, feeTx] });
      });
  
      toast({
        title: t.paymentComplete,
        description: t.paymentCompleteDesc,
      });
    } catch (error) {
      console.error("Error releasing payment:", error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while releasing the payment.",
        variant: "destructive"
      });
    }
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
        setIsRanking(false);
        return;
      }
      
      const freelancerProfilesWithProposals = jobProposals.map(proposal => {
        const profile = freelancerProfiles.find(p => p.userId === proposal.freelancerId);
        return {
            profile: `Skills: ${profile?.skills?.join(', ') ?? ''}. Bio: ${profile?.bio ?? ''}`,
            proposal: proposal.coverLetter,
        }
      }).filter(p => p.profile && p.proposal);

      if (freelancerProfilesWithProposals.length === 0) {
          toast({ variant: "destructive", title: "Cannot Rank", description: "Not enough profile information from applicants to rank."});
          setIsRanking(false);
          return;
      }

      const result = await rankMatchingFreelancers({
        jobDescription: job.description,
        freelancerProfiles: freelancerProfilesWithProposals,
      });

      if (result.success) {
        const rankedWithOriginals = result.data.map(ranked => {
            const originalProposal = proposals.find(p => p.jobId === job.id && p.coverLetter === ranked.proposal);
            return originalProposal ? { ...ranked, originalProposal } : null;
        }).filter((item): item is RankedFreelancer => !!item);
        setRankedFreelancers(rankedWithOriginals.sort((a, b) => b.rank - a.rank));
      } else {
        toast({
            variant: "destructive",
            title: t.rankingFailed,
            description: result.error || t.rankingFailedDesc,
        });
      }

    } catch (error) {
      console.error('Error ranking freelancers:', error);
      toast({
        variant: "destructive",
        title: t.rankingFailed,
        description: (error as Error).message || t.rankingFailedDesc,
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
  
  const handleReviewSubmit = async (jobId: string, revieweeId: string, rating: number, comment: string) => {
      await addReview({
          jobId,
          reviewerId: user.id,
          revieweeId,
          rating,
          comment
      });
      await markJobAsReviewed(jobId, 'client');
      toast({ title: t.reviewSubmissionSuccess, description: t.reviewSubmissionSuccessDesc });
      setJobToReview(null);
  };

  const getStatusVariant = (status?: Job['status']) => {
    switch (status) {
        case 'Open': return 'default';
        case 'Completed': return 'default';
        case 'InProgress': return 'secondary';
        default: return 'secondary';
    }
  };

  const handleOpenEditDialog = (job: Job) => {
    setEditingJob(job);
    setIsPostJobOpen(true);
  };
  
  const handleOpenPostDialog = () => {
    setEditingJob(null);
    setIsPostJobOpen(true);
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
        setEditingJob(null);
    }
    setIsPostJobOpen(open);
  };

  const selectedJob = selectedJobId ? clientJobs.find((job) => job.id === selectedJobId) : null;
  
  // Single Job View
  if (selectedJob) {
    const jobProposals = proposals.filter(p => p.jobId === selectedJob.id);
    const hiredFreelancer = allUsers.find(u => u.id === selectedJob.hiredFreelancerId);
    
    const ProposalCard = ({ proposal, isRanked = false, rank, reason }: { proposal: Proposal, isRanked?: boolean, rank?: number, reason?: string }) => {
        const freelancerUser = allUsers.find(u => u.id === proposal.freelancerId);
        
        if (!freelancerUser) {
            return null;
        }

        const proposalStatus = proposal.status || 'Pending';
        const statusVariant = proposalStatus === 'Accepted' ? 'default' : proposalStatus === 'Rejected' ? 'destructive' : 'secondary';
        
        return (
            <Card className={isRanked ? "bg-primary/5" : ""}>
                <CardHeader className='flex-row items-start gap-4'>
                    {isRanked && rank && (
                        <Badge variant="default" className="text-lg h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                          #{rank}
                        </Badge>
                    )}
                    <Avatar>
                        <AvatarImage src={freelancerUser.avatarUrl} alt={freelancerUser.name} />
                        <AvatarFallback>{freelancerUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">{freelancerUser.name}</p>
                            <Badge variant={statusVariant}>{t[proposalStatus.toLowerCase() as keyof typeof t] || proposalStatus}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.proposedRate}: ${proposal.proposedRate}/hr</p>
                        {isRanked && reason && <CardDescription className="pt-1">{t.reasoning}: {reason}</CardDescription>}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">"{proposal.coverLetter}"</p>
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
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedJobId(null); setRankedFreelancers([]); }} className="justify-start mb-4 w-fit px-2">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5" /> {t.proposals}</h3>
                      {selectedJob.status === 'Open' && (
                           <Button onClick={() => handleRankFreelancers(selectedJob)} disabled={isRanking}>
                              <Wand2 className='mr-2 h-4 w-4' />
                              {isRanking ? t.ranking : t.findBestMatches}
                          </Button>
                      )}
                  </div>
                  
                  {isRanking && (
                      <div className="flex justify-center items-center py-8">
                          <LoadingDots />
                      </div>
                  )}
                  
                  {rankedFreelancers.length > 0 ? (
                      <div className="space-y-4">
                          {rankedFreelancers.map((freelancer) => {
                              if (!freelancer.originalProposal) return null;
                              return (
                                <ProposalCard 
                                    key={freelancer.originalProposal.id} 
                                    proposal={freelancer.originalProposal}
                                    isRanked={true}
                                    rank={freelancer.rank}
                                    reason={freelancer.reason}
                                />
                            )
                          })}
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
                          <Button disabled={isUsersLoading}>{t.approveAndPay}</Button>
                      </ApprovePaymentDialog>
                  </CardFooter>
              )}
          </Card>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{t.chooseNextStep}</AlertDialogTitle>
                  <AlertDialogDescription>
                      {t.nextStepDesc.replace('{name}', (proposalToHire && allUsers.find(u => u.id === proposalToHire.freelancerId)?.name) || 'this freelancer')}
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

  // Main Dashboard View
  return (
    <div className="space-y-6">
      <Dialog open={isPostJobOpen} onOpenChange={handleDialogChange}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Manage your job postings and service orders.</p>
            </div>
            <DialogTrigger asChild>
              {user.verificationStatus === 'verified' ? (
                <Button onClick={handleOpenPostDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.postNewJob}
                </Button>
              ) : (
                <Button disabled>{t.postNewJob}</Button>
              )}
            </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? t.editJobTitle : t.postNewJobTitle}</DialogTitle>
            <DialogDescription>{editingJob ? t.editJobDesc : t.postNewJobDesc}</DialogDescription>
          </DialogHeader>
          <JobPostForm jobToEdit={editingJob} onFinished={handleDialogChange.bind(null, false)} />
        </DialogContent>
      </Dialog>


      {user.verificationStatus !== 'verified' && (
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.verificationRequiredTitle}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            {t.mustBeVerifiedToPost}
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/verify">{t.verifyNow}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="postings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="postings">{t.myJobPostings}</TabsTrigger>
            <TabsTrigger value="orders">{t.myServiceOrders}</TabsTrigger>
        </TabsList>
        <TabsContent value="postings" className="mt-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{t.myJobPostings}</CardTitle>
                            <CardDescription>{t.clientJobDesc}</CardDescription>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/find-freelancers">
                                <Search className="mr-2 h-4 w-4" />
                                {t.findFreelancers}
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {manualJobs.length > 0 ? manualJobs.map((job) => {
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
                                    {t.budget}: ${job.budget ? job.budget.toFixed(2) : '0.00'}
                                    </CardDescription>
                                </div>
                                <Badge variant={getStatusVariant(status)}>{t[status.toLowerCase() as keyof typeof t] || status}</Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                <Button onClick={() => setSelectedJobId(job.id)}>{t.viewDetailsAndProposals}</Button>
                                {status === 'InProgress' && hiredFreelancer && (
                                        <Button variant="outline" onClick={() => openChat(hiredFreelancer)}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            {t.chatWith} {hiredFreelancer.name}
                                        </Button>
                                    )}
                                    {status === 'InProgress' && hiredFreelancer && (
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <ShieldCheck className="h-5 w-5 text-success" />
                                            <span>${(job.budget || 0).toFixed(2)} {t.inEscrow}</span>
                                        </div>
                                    )}
                                    {status === 'Completed' && hiredFreelancer && (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center text-sm text-success gap-2">
                                            <CheckCircle className="h-5 w-5"/>
                                            <span>{t.paidTo} <span className="font-semibold">{hiredFreelancer.name}</span></span>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={() => setJobToReview(job)}
                                            disabled={job.clientReviewed}
                                        >
                                            <Star className="mr-2 h-4 w-4" />
                                            {job.clientReviewed ? t.reviewSubmitted : t.leaveReview}
                                        </Button>
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
                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(job)} disabled={!canEdit}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>{t.editJob}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger disabled={status === 'Completed' || status === 'InProgress'}>{t.changeStatus}</DropdownMenuSubTrigger>
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
                                                <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90">{t.deleteJob}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardFooter>
                            </Card>
                        );
                    }) : (
                    <p className="text-muted-foreground text-center py-4">{t.noJobsPosted}</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.myServiceOrders}</CardTitle>
                    <CardDescription>{t.myServiceOrdersDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {serviceOrderJobs.length > 0 ? serviceOrderJobs.map((job) => {
                        const status = job.status || 'Open';
                        const hiredFreelancer = job.hiredFreelancerId ? allUsers.find(u => u.id === job.hiredFreelancerId) : undefined;
                        
                        if (!hiredFreelancer) return null;
                        
                        return (
                            <Card key={job.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{job.title}</CardTitle>
                                            <CardDescription>{t.budget}: ${(job.budget || 0).toFixed(2)}</CardDescription>
                                        </div>
                                        <Badge variant={getStatusVariant(status)}>{t[status.toLowerCase() as keyof typeof t] || status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {status === 'InProgress' && (
                                            <Button variant="outline" onClick={() => openChat(hiredFreelancer)}>
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                {t.chatWith} {hiredFreelancer.name}
                                            </Button>
                                        )}
                                        {status === 'InProgress' && (
                                            <>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <ShieldCheck className="h-5 w-5 text-success" />
                                                <span>${(job.budget || 0).toFixed(2)} {t.inEscrow}</span>
                                            </div>
                                            <ApprovePaymentDialog
                                                job={job}
                                                freelancer={hiredFreelancer}
                                                onConfirm={() => handleApproveAndPay(job.id)}
                                            >
                                                <Button disabled={isUsersLoading}>{t.approveAndPay}</Button>
                                            </ApprovePaymentDialog>
                                            </>
                                        )}
                                        {status === 'Completed' && (
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center text-sm text-success gap-2">
                                                    <CheckCircle className="h-5 w-5"/>
                                                    <span>{t.paidTo} <span className="font-semibold">{hiredFreelancer.name}</span></span>
                                                </div>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={() => setJobToReview(job)}
                                                    disabled={job.clientReviewed}
                                                >
                                                    <Star className="mr-2 h-4 w-4" />
                                                    {job.clientReviewed ? t.reviewSubmitted : t.leaveReview}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    }) : (
                        <p className="text-muted-foreground text-center py-4">{t.noServiceOrders}</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      {jobToReview && jobToReview.hiredFreelancerId && (
            <ReviewFormDialog
                isOpen={!!jobToReview}
                onClose={() => setJobToReview(null)}
                reviewee={allUsers.find(u => u.id === jobToReview.hiredFreelancerId)}
                job={jobToReview}
                onSubmit={handleReviewSubmit}
            />
        )}
    </div>
  );
}
