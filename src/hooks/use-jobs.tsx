
'use client';

import * as React from 'react';
import { useLocalStorageState } from './use-local-storage-state';
import type { Job } from '@/lib/types';
import { mockJobs } from '@/lib/mock-data';

interface JobsContextType {
  jobs: Job[];
  addJob: (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId' | 'clientReviewed' | 'freelancerReviewed' | 'postedDate'>) => Promise<boolean>;
  deleteJob: (jobId: string) => Promise<boolean>;
  updateJobStatus: (jobId: string, status: Job['status']) => Promise<boolean>;
  updateJob: (jobId: string, jobData: Partial<Omit<Job, 'id'>>) => Promise<boolean>;
  hireFreelancerForJob: (jobId: string, freelancerId: string) => Promise<boolean>;
  releasePayment: (jobId: string) => Promise<boolean>;
  markJobAsReviewed: (jobId: string, role: 'client' | 'freelancer') => Promise<boolean>;
  deleteJobsByClientId: (clientId: string) => Promise<boolean>;
}

const JobsContext = React.createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useLocalStorageState<Job[]>('all-jobs', mockJobs);

  const addJob = async (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId' | 'clientReviewed' | 'freelancerReviewed' | 'postedDate'>): Promise<boolean> => {
    const newJob: Job = {
      id: `job-${Date.now()}`,
      ...jobData,
      status: 'Open',
      clientReviewed: false,
      freelancerReviewed: false,
      postedDate: new Date().toISOString(),
    };
    setJobs(prevJobs => [...prevJobs, newJob]);
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
  
  const releasePayment = async (jobId: string): Promise<boolean> => {
      setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId ? { ...job, status: 'Completed' } : job
      ));
      return true;
  };

  const markJobAsReviewed = async (jobId: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
            const fieldToUpdate = role === 'client' ? { clientReviewed: true } : { freelancerReviewed: true };
            return { ...job, ...fieldToUpdate };
        }
        return job;
    }));
    return true;
  };

  const deleteJobsByClientId = async (clientId: string): Promise<boolean> => {
      setJobs(prev => prev.filter(j => j.clientId !== clientId));
      return true;
  }

  const value = { jobs, addJob, deleteJob, updateJobStatus, updateJob, hireFreelancerForJob, releasePayment, markJobAsReviewed, deleteJobsByClientId };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export const useJobs = () => {
  const context = React.useContext(JobsContext);
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};
