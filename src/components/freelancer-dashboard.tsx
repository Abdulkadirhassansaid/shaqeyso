
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
import type { Job, User, Proposal, FreelancerProfile } from '@/lib/types';
import { ArrowLeft, DollarSign, Tag, Clock, Search, Wand2, CheckCircle, MessageSquare, ShieldCheck, Star, Edit, Trash2, Calendar, AlertCircle, BadgeCheck } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { Badge } from './ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { recommendJobsForFreelancer } from '@/app/actions';
import { cn } from '@/lib/utils';
import { LoadingDots } from './loading-dots';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ReviewFormDialog } from './review-form-dialog';
import { useReviews } from '@/hooks/use-reviews';
import { useProposals } from '@/hooks/use-proposals';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from './ui/label';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUsers } from '@/hooks/use-users';
import { useChat } from '@/hooks/use-chat';


type RecommendedJob = Job & {
    rank: number;
    reason: string;
};

export function FreelancerDashboard() {
  const { user } = useAuth();
  const { jobs, markJobAsReviewed } = useJobs();
  const { proposals, deleteProposal } = useProposals();
  const { users: allUsers } = useUsers();
  const { toast } = useToast();
  const { addReview } = useReviews();
  
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [editingProposal, setEditingProposal] = React.useState<Proposal | null>(null);
  const [deletingProposal, setDeletingProposal] = React.useState<Proposal | null>(null);
  const [viewingProposal, setViewingProposal] = React.useState<Proposal | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [recommendedJobs, setRecommendedJobs] = React.useState<RecommendedJob[]>([]);
  const [isRecommending, setIsRecommending] = React.useState(false);
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState('find-work');
  const [jobToReview, setJobToReview] = React.useState<Job | null>(null);
  const [freelancerProfile, setFreelancerProfile] = React.useState<FreelancerProfile | null>(null);
  const { openChat } = useChat();

  React.useEffect(() => {
    if (!user || !db) return;
    const unsub = onSnapshot(doc(db, 'freelancerProfiles', user.id), (doc) => {
        if (doc.exists()) {
            setFreelancerProfile({ ...doc.data(), userId: doc.id } as FreelancerProfile);
        }
    });
    return () => unsub();
  }, [user]);
  
  React.useEffect(() => {
    const getRecommendations = async () => {
      if (!user || !freelancerProfile) return;
      if (!freelancerProfile.skills?.length && !freelancerProfile.bio) {
          return;
      }
      
      const profileString = `Skills: ${freelancerProfile.skills.join(', ')}. Bio: ${freelancerProfile.bio || ''}`;
      
      setIsRecommending(true);

      try {
          const openJobs = jobs.filter(job => job.status === 'Open');
          const result = await recommendJobsForFreelancer({
              freelancerProfile: profileString,
              jobs: openJobs
          });
          
          if (result.success) {
            const sortedRecommendedJobs = result.data
                .sort((a, b) => b.rank - a.rank)
                .map(rec => {
                    const fullJob = openJobs.find(job => job.id === rec.jobId);
                    return fullJob ? { ...fullJob, rank: rec.rank, reason: rec.reason } : null;
                })
                .filter((job): job is RecommendedJob => job !== null);
            
            setRecommendedJobs(sortedRecommendedJobs);
          } else {
            console.error(result.error);
          }

      } catch (error) {
          console.error("Error getting recommendations:", error);
      } finally {
          setIsRecommending(false);
      }
    };
    
    if (jobs.length > 0 && freelancerProfile) {
      getRecommendations();
    }
  }, [jobs, freelancerProfile, user]);

  if (!user) {
    return null; 
  }

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
  
  const handleDeleteProposal = async () => {
    if (!deletingProposal) return;
    const success = await deleteProposal(deletingProposal.id);
    if (success) {
      toast({ title: t.proposalDeleted, description: t.proposalDeletedDesc });
    }
    setDeletingProposal(null);
  };

  const profileString = `Skills: ${freelancerProfile?.skills?.join(', ') ?? ''}. Bio: ${freelancerProfile?.bio ?? ''}`;
  
  if (selectedJob) {
    return (
      <div className="w-full h-full bg-background md:bg-transparent">
        <div className="p-4 flex items-center gap-4 md:hidden">
            <h1 className="text-xl font-bold">{selectedJob.title}</h1>
        </div>
        <Card className="w-full h-full md:h-auto border-0 md:border md:shadow-sm">
            <CardHeader className="hidden md:block">
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
                {selectedJob.postedDate && (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{t.posted} {formatDistanceToNow(new Date(selectedJob.postedDate), { addSuffix: true })}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{t.deadline}: {selectedJob.deadline}</span>
                </div>
            </div>
            </CardHeader>
            <CardContent>
                <h3 className='font-semibold mb-2'>{t.jobDescriptionTitle}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
            </CardContent>
            <CardFooter className='flex-col items-start gap-6'>
            {user.verificationStatus === 'verified' ? (
                <ProposalForm 
                    job={selectedJob} 
                    freelancerProfile={profileString} 
                    onFinished={() => setSelectedJob(null)}
                />
            ) : (
                <Alert variant="default" className="w-full flex flex-col items-center text-center p-6">
                <AlertCircle className="h-6 w-6 mb-2" />
                <AlertTitle className="text-lg font-semibold">{t.verificationRequiredTitle}</AlertTitle>
                <AlertDescription className="mt-1">
                    {t.verificationRequiredFreelancerDesc}
                </AlertDescription>
                <Button asChild className="mt-4">
                    <Link href="/verify">{t.verifyNow}</Link>
                </Button>
                </Alert>
            )}
            </CardFooter>
        </Card>
      </div>
    );
  }

  if (editingProposal) {
    const jobForProposal = jobs.find(j => j.id === editingProposal.jobId);
    if (!jobForProposal) return null;
    return (
        <ProposalForm 
            job={jobForProposal}
            freelancerProfile={profileString}
            onFinished={() => setEditingProposal(null)}
            proposalToEdit={editingProposal}
        />
    )
  }

  const openJobs = jobs.filter(job => job.status === 'Open');
  const filteredJobs = openJobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const myProposals = proposals.filter(p => p.freelancerId === user.id);
  const myProjects = jobs.filter(job => job.hiredFreelancerId === user.id && ['InProgress', 'Completed'].includes(job.status));

  const renderFindWorkContent = () => {
    if (isRecommending) {
      return (
        <div className="flex justify-center items-center py-8">
            <LoadingDots />
        </div>
      );
    }
    
    if (openJobs.length === 0) {
      return <p className="text-muted-foreground text-center py-8">{t.noOpenJobsAvailable}</p>;
    }

    if (filteredJobs.length === 0 && searchQuery) {
      return <p className="text-muted-foreground text-center py-8">{t.noJobsFound}</p>;
    }

    const jobsToDisplay = searchQuery ? filteredJobs : (recommendedJobs.length > 0 ? recommendedJobs : filteredJobs);

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
        {jobsToDisplay.map((job) => {
            const recommendation = recommendedJobs.find(rec => rec.id === job.id);
            const isRecommended = !!recommendation;
            
            return (
                 <Card key={job.id} className={cn("flex flex-col transition-all duration-300 hover:-translate-y-1", isRecommended && "border-primary/50 bg-primary/5")}>
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
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              <Badge variant={isRecommended ? "outline" : "secondary"}>{job.category}</Badge>
                          </div>
                          {job.postedDate && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {formatDistanceToNow(new Date(job.postedDate), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </div>
                          )}
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
                    <CardFooter className='flex-col items-stretch gap-4'>
                        <div className="flex items-center gap-2 text-base font-semibold">
                            <DollarSign className="h-5 w-5 text-success" />
                            <span>${(job.budget || 0).toFixed(2)}</span>
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
                if (!client) return null;
                const status = job.status as Job['status'];
                const statusVariant = status === 'Completed' ? 'default' : 'secondary';
                
                return (
                    <Card key={job.id} className="transition-all hover:-translate-y-1">
                        <CardHeader className="flex flex-row justify-between items-start">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge variant={statusVariant}>
                              {t[status.toLowerCase() as keyof typeof t] || status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <p className="font-medium">{t.client}: {client.name}</p>
                                {(status === 'InProgress') && (
                                    <div className="flex items-center text-success gap-2 font-medium">
                                        <ShieldCheck className="h-4 w-4"/>
                                        <span>${(job.budget || 0).toFixed(2)} {t.inEscrow}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-2">
                           
                            {status === 'Completed' && (
                                <div className="flex flex-col items-stretch gap-2 w-full p-3 bg-success/10 border border-success/20 rounded-lg dark:bg-success/20 dark:border-success/30">
                                    <div className="flex items-center text-sm text-success dark:text-success/90 gap-2">
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
                            {(status === 'InProgress') && (
                                <Button className="w-full" variant="outline" onClick={() => openChat(client)}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {t.chatWithClient}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    );
  }
  
  const renderMyProposalsContent = () => {
    if (myProposals.length === 0) {
      return <p className="text-muted-foreground text-center py-8">{t.noProposalsSubmitted}</p>;
    }
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myProposals.map(proposal => {
                const job = jobs.find(j => j.id === proposal.jobId);
                if (!job) return null;
                const status = proposal.status || 'Pending';
                
                return (
                    <Card 
                        key={proposal.id} 
                        className="flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1"
                        onClick={() => setViewingProposal(proposal)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                                <Badge variant={status === 'Accepted' ? 'default' : status === 'Rejected' ? 'destructive' : 'secondary'}>
                                    {t[status.toLowerCase() as keyof typeof t] || status}
                                </Badge>
                            </div>
                            <CardDescription>{t.budget}: ${(job.budget || 0).toFixed(2)}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground line-clamp-3 italic">
                                "{proposal.coverLetter}"
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" className="p-0 h-auto text-primary dark:text-accent">{t.viewDetailsAndProposals}</Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center px-0">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="find-work">{t.findWork}</TabsTrigger>
              <TabsTrigger value="my-proposals">{t.myProposals}</TabsTrigger>
              <TabsTrigger value="my-projects">{t.myProjects}</TabsTrigger>
          </TabsList>
        </div>
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
                </CardHeader>
                <CardContent>{renderFindWorkContent()}</CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="my-proposals" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.myProposals}</CardTitle>
                    <CardDescription>{t.myProposalsDesc}</CardDescription>
                </CardHeader>
                <CardContent>{renderMyProposalsContent()}</CardContent>
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
      
      {jobToReview && (
          <ReviewFormDialog
              isOpen={!!jobToReview}
              onClose={() => setJobToReview(null)}
              reviewee={allUsers.find(u => u.id === jobToReview.clientId)}
              job={jobToReview}
              onSubmit={handleReviewSubmit}
          />
      )}
      
      {viewingProposal && (
          <Dialog open={!!viewingProposal} onOpenChange={(isOpen) => !isOpen && setViewingProposal(null)}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{jobs.find(j => j.id === viewingProposal.jobId)?.title}</DialogTitle>
                      <DialogDescription>
                          {t.yourProposal}
                      </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      <div>
                          <Label className="font-semibold">{t.coverLetter}</Label>
                          <div className="mt-2 rounded-md border p-4 text-sm text-muted-foreground max-h-60 overflow-y-auto">
                              <p className="whitespace-pre-wrap">{viewingProposal.coverLetter}</p>
                          </div>
                      </div>
                      <p className="font-semibold text-sm">{t.proposedRate}: <span className="font-normal">${viewingProposal.proposedRate}/hr</span></p>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between items-center">
                        <Badge variant={viewingProposal.status === 'Accepted' ? 'default' : viewingProposal.status === 'Rejected' ? 'destructive' : 'secondary'}>
                          {t.status}: {t[viewingProposal.status.toLowerCase() as keyof typeof t] || viewingProposal.status}
                      </Badge>
                      {viewingProposal.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                              <Button variant="destructive" onClick={() => {
                                  setDeletingProposal(viewingProposal);
                                  setViewingProposal(null);
                              }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t.delete}
                              </Button>
                              <Button variant="outline" onClick={() => {
                                  setEditingProposal(viewingProposal);
                                  setViewingProposal(null);
                              }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t.edit}
                              </Button>
                          </div>
                      ) : (
                          <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={() => setViewingProposal(null)}>{t.closed}</Button>
                          </DialogClose>
                      )}
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
      <AlertDialog open={!!deletingProposal} onOpenChange={(isOpen) => !isOpen && setDeletingProposal(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteProposalConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteProposalConfirmDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingProposal(null)}>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProposal} className="bg-destructive hover:bg-destructive/90">{t.delete}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
