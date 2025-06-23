'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { mockJobs as initialJobs } from '@/lib/mock-data';
import type { Job } from '@/lib/types';

interface JobsContextType {
  jobs: Job[];
  addJob: (jobData: Omit<Job, 'id' | 'proposals'>) => Promise<boolean>;
}

const JobsContext = React.createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useLocalStorageState('shaqo-jobs', initialJobs);

  const addJob = async (jobData: Omit<Job, 'id' | 'proposals'>): Promise<boolean> => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
    };
    setJobs(prevJobs => [newJob, ...prevJobs]);
    return true;
  };

  const value = { jobs, addJob };

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export const useJobs = () => {
  const context = React.useContext(JobsContext);
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};
