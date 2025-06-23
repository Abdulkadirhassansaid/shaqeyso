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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateJobDescription } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Wand2 } from 'lucide-react';
import { LoadingDots } from './loading-dots';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-jobs';

export function JobPostForm() {
  const { user } = useAuth();
  const { addJob } = useJobs();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [description, setDescription] = React.useState('');
  const promptRef = React.useRef<HTMLTextAreaElement>(null);


  const handleGenerateDescription = async () => {
    if (!promptRef.current?.value) {
      toast({
        title: t.promptEmpty,
        description: t.promptEmptyDesc,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateJobDescription({
        prompt: promptRef.current.value,
      });
      setDescription(result.jobDescription);
    } catch (error) {
      console.error('Error generating job description:', error);
      toast({
        title: t.generationFailed,
        description: t.generationFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !budget || !deadline || !description || !user) {
        toast({
            title: t.missingFieldsTitle,
            description: t.missingFieldsDesc,
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    const success = await addJob({
        title,
        category,
        budget: Number(budget),
        deadline,
        description,
        clientId: user.id
    });

    if(success) {
        toast({
            title: t.jobPostedTitle,
            description: t.jobPostedDesc,
        });
        // Reset form
        setTitle('');
        setCategory('');
        setBudget('');
        setDeadline('');
        setDescription('');
        if(promptRef.current) promptRef.current.value = '';
    } else {
        toast({
            title: t.jobPostFailedTitle,
            description: t.jobPostFailedDesc,
            variant: "destructive",
        });
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
            <CardTitle>{t.postNewJobTitle}</CardTitle>
            <CardDescription>
            {t.postNewJobDesc}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="job-title">{t.jobTitle}</Label>
                    <Input id="job-title" placeholder={t.jobTitlePlaceholder} value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">{t.category}</Label>
                    <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger id="category">
                            <SelectValue placeholder={t.selectCategory} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="web-dev">{t.webDev}</SelectItem>
                            <SelectItem value="mobile-dev">{t.mobileDev}</SelectItem>
                            <SelectItem value="design">{t.design}</SelectItem>
                            <SelectItem value="writing">{t.writing}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="budget">{t.budgetLabel}</Label>
                    <Input id="budget" type="number" placeholder={t.budgetPlaceholder} value={budget} onChange={e => setBudget(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deadline">{t.deadlineLabel}</Label>
                    <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="ai-prompt">{t.jobSummaryPrompt}</Label>
                <Textarea 
                    id="ai-prompt" 
                    ref={promptRef}
                    placeholder={t.jobSummaryPlaceholder} 
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isGenerating ? t.generating : t.generateWithAI}
                </Button>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">{t.jobDescription}</Label>
                {isGenerating ? (
                    <div className="flex items-center justify-center rounded-md border border-dashed min-h-[120px]">
                        <LoadingDots />
                    </div>
                ) : (
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.jobDescriptionPlaceholder}
                        rows={8}
                        required
                    />
                )}
            </div>
        </CardContent>
        <CardFooter>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.posting : t.postJob}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
