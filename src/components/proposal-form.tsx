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

interface ProposalFormProps {
    job: Job;
    freelancerProfile: string;
}

export function ProposalForm({ job, freelancerProfile }: ProposalFormProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState('');
  const { toast } = useToast();

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
        title: 'Generation Failed',
        description: 'Could not generate proposal at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full border-2 border-accent/50">
        <CardHeader>
            <CardTitle>Submit Your Proposal</CardTitle>
            <CardDescription>Use our AI assistant to craft the perfect cover letter and stand out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="rate">Your Hourly Rate ($)</Label>
                    <Input id="rate" type="number" placeholder="e.g., 50" />
                </div>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="cover-letter">Cover Letter</Label>
                    <Button variant="outline" size="sm" onClick={handleGenerateProposal} disabled={isGenerating}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Write with AI'}
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
                        placeholder="Write your proposal or use the AI assistant to generate one."
                        rows={10}
                    />
                )}
            </div>
            <Button className="w-full md:w-auto">Submit Proposal</Button>
        </CardContent>
    </Card>
  );
}
