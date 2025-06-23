
'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { mockJobs as initialJobs } from '@/lib/mock-data';
import type { Job, SubmittedFile } from '@/lib/types';

interface JobsContextType {
  jobs: Job[];
  addJob: (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId'>) => Promise<boolean>;
  deleteJob: (jobId: string) => Promise<boolean>;
  updateJobStatus: (jobId: string, status: Job['status']) => Promise<boolean>;
  updateJob: (jobId: string, jobData: Partial<Omit<Job, 'id'>>) => Promise<boolean>;
  hireFreelancerForJob: (jobId: string, freelancerId: string) => Promise<boolean>;
  submitProject: (jobId: string, files: SubmittedFile[]) => Promise<boolean>;
  releasePayment: (jobId: string) => Promise<boolean>;
}

const JobsContext = React.createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useLocalStorageState('shaqo-jobs', initialJobs);

  const addJob = async (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId'>): Promise<boolean> => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      status: 'Open',
      submittedFiles: [],
    };
    setJobs(prevJobs => [newJob, ...prevJobs]);
    return true;
  };

  const deleteJob = async (jobId: string): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    return true;
  };

  const updateJobStatus = async (jobId: string, status: Job['status']): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));
    return true;
  };

  const updateJob = async (jobId: string, jobData: Partial<Omit<Job, 'id'>>): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, ...jobData } : job
    ));
    return true;
  };
  
  const hireFreelancerForJob = async (jobId: string, freelancerId: string): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, status: 'InProgress', hiredFreelancerId: freelancerId } : job
    ));
    return true;
  }

  const submitProject = async (jobId: string, files: SubmittedFile[]): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, status: 'AwaitingApproval', submittedFiles: files } : job
    ));
    return true;
  };
  
  const releasePayment = async (jobId: string): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, status: 'Completed' } : job
    ));
    return true;
  };


  const value = { jobs, addJob, deleteJob, updateJobStatus, updateJob, hireFreelancerForJob, submitProject, releasePayment };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export const useJobs = () => {
  const context = React.useContext(JobsContext);
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};
