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
import { ArrowLeft, DollarSign, Tag, Clock } from 'lucide-react';
import { ProposalForm } from './proposal-form';
import { Badge } from './ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { useJobs } from '@/hooks/use-jobs';

interface FreelancerDashboardProps {
  user: User;
}

export function FreelancerDashboard({ user }: FreelancerDashboardProps) {
  const { jobs } = useJobs();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const { t } = useLanguage();

  const openJobs = jobs.filter(job => job.status === 'Open');

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
            <ProposalForm job={selectedJob} freelancerProfile="Experienced React developer with a knack for building beautiful and performant user interfaces. Proficient in TypeScript, Next.js, and Tailwind CSS." />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>{t.findWork}</CardTitle>
            <CardDescription>{t.findWorkDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {openJobs.map((job) => (
                <Card key={job.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-headline">{job.title}</CardTitle>
                        <div className="flex items-center gap-2 pt-1">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="secondary">{job.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                    </CardContent>
                    <CardFooter className='flex-col items-start gap-4'>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            <span>${job.budget}</span>
                        </div>
                        <Button className="w-full" onClick={() => setSelectedJob(job)}>{t.viewAndApply}</Button>
                    </CardFooter>
                </Card>
            ))}
        </CardContent>
    </Card>
  );
}
