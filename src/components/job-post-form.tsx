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

export function JobPostForm() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const promptRef = React.useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleGenerateDescription = async () => {
    if (!promptRef.current?.value) {
      toast({
        title: 'Prompt is empty',
        description: 'Please provide a short description of the job.',
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
        title: 'Generation Failed',
        description: 'Could not generate job description at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post a New Job</CardTitle>
        <CardDescription>
          Fill in the details below. Use our AI assistant to help write a great job description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <Input id="job-title" placeholder="e.g., Senior React Developer" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="web-dev">Web Development</SelectItem>
                        <SelectItem value="mobile-dev">Mobile Development</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input id="budget" type="number" placeholder="e.g., 500" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="ai-prompt">Job summary prompt</Label>
            <Textarea 
                id="ai-prompt" 
                ref={promptRef}
                placeholder="e.g., I need a logo for my new coffee shop. It should be modern and minimalist." 
            />
            <Button variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Description with AI'}
            </Button>
        </div>
        <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            {isGenerating ? (
                <div className="flex items-center justify-center rounded-md border border-dashed min-h-[120px]">
                    <LoadingDots />
                </div>
            ) : (
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="The AI-generated job description will appear here."
                    rows={8}
                />
            )}
        </div>
      </CardContent>
      <CardFooter>
        <Button>Post Job</Button>
      </CardFooter>
    </Card>
  );
}
