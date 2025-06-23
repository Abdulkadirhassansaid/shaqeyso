
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import type { Job } from '@/lib/types';

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
  const [jobs, setJobs] = React.useState<Job[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "jobs"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData: Job[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
      setJobs(jobsData);
    });
    return () => unsubscribe();
  }, []);

  const addJob = async (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId' | 'clientReviewed' | 'freelancerReviewed' | 'postedDate'>): Promise<boolean> => {
    try {
      const newJob = {
        ...jobData,
        status: 'Open' as const,
        clientReviewed: false,
        freelancerReviewed: false,
        postedDate: new Date().toISOString(),
      };
      await addDoc(collection(db, 'jobs'), newJob);
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteJob = async (jobId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      return true;
    } catch (error) { return false; }
  };

  const updateJobStatus = async (jobId: string, status: Job['status']): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status });
      return true;
    } catch (error) { return false; }
  };

  const updateJob = async (jobId: string, jobData: Partial<Omit<Job, 'id'>>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), jobData);
      return true;
    } catch (error) { return false; }
  };
  
  const hireFreelancerForJob = async (jobId: string, freelancerId: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: 'InProgress', hiredFreelancerId: freelancerId });
      return true;
    } catch (error) { return false; }
  }
  
  const releasePayment = async (jobId: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: 'Completed' });
      return true;
    } catch (error) { return false; }
  };

  const markJobAsReviewed = async (jobId: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    try {
      const fieldToUpdate = role === 'client' ? { clientReviewed: true } : { freelancerReviewed: true };
      await updateDoc(doc(db, 'jobs', jobId), fieldToUpdate);
      return true;
    } catch (error) { return false; }
  };

  const deleteJobsByClientId = async (clientId: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "jobs"), where("clientId", "==", clientId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return true;
    } catch(error) {
      return false;
    }
  };

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
