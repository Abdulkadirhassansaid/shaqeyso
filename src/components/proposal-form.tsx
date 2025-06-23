'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { assistProposalGeneration } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Wand2 } from 'lucide-react';
import { LoadingDots } from './loading-dots';
import type { Job } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useProposals } from '@/hooks/use-proposals';
import { useAuth } from '@/hooks/use-auth';

interface ProposalFormProps {
    job: Job;
    freelancerProfile: string;
    onFinished: () => void;
}

export function ProposalForm({ job, freelancerProfile, onFinished }: ProposalFormProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState('');
  const [proposedRate, setProposedRate] = React.useState('');
  const { toast } = useToast();
  const { t } = useLanguage();
  const { addProposal } = useProposals();
  const { user } = useAuth();

  const handleGenerateProposal = async () => {
    setIsGenerating(true);
    try {
      const result = await assistProposalGeneration({
        jobDescription: job.description,
        freelancerProfile: freelancerProfile,
      });
      setCoverLetter(result.proposal);
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast({
        title: t.proposalGenFailed,
        description: t.proposalGenFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverLetter || !proposedRate || !user) {
        toast({
            title: t.missingFieldsTitle,
            description: t.missingProposalFields,
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    const success = await addProposal({
        jobId: job.id,
        freelancerId: user.id,
        coverLetter: coverLetter,
        proposedRate: Number(proposedRate),
    });
    setIsSubmitting(false);

    if (success) {
        toast({
            title: t.proposalSubmitted,
            description: t.proposalSubmittedDesc,
        });
        onFinished();
    } else {
        toast({
            title: t.submissionFailed,
            description: t.submissionFailedDesc,
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full border-2 border-accent/50">
        <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle>{t.submitYourProposal}</CardTitle>
                <CardDescription>{t.submitProposalDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="rate">{t.yourHourlyRate}</Label>
                        <Input 
                            id="rate" 
                            type="number" 
                            placeholder={t.ratePlaceholder} 
                            value={proposedRate} 
                            onChange={e => setProposedRate(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="cover-letter">{t.coverLetter}</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateProposal} disabled={isGenerating || isSubmitting}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            {isGenerating ? t.generating : t.writeWithAI}
                        </Button>
                    </div>
                    {isGenerating ? (
                        <div className="flex items-center justify-center rounded-md border border-dashed min-h-[120px]">
                            <LoadingDots />
                        </div>
                    ) : (
                        <Textarea
                            id="cover-letter"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder={t.coverLetterPlaceholder}
                            rows={10}
                            required
                        />
                    )}
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={isGenerating || isSubmitting}>
                    {isSubmitting ? t.submittingProposal : t.submitProposal}
                </Button>
            </CardContent>
        </form>
    </Card>
  );
}
