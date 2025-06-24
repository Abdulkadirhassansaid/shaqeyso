
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  deleteJobsByClientId: (clientId: string) => Promise<boolean>; // This would require a backend function
}

const JobsContext = React.createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<Job[]>([]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db!, 'jobs'), (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id,
            postedDate: doc.data().postedDate?.toDate()?.toISOString() || new Date().toISOString()
        } as Job));
        setJobs(jobsData);
    });
    return () => unsubscribe();
  }, []);

  const addJob = async (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId' | 'clientReviewed' | 'freelancerReviewed' | 'postedDate'>): Promise<boolean> => {
    try {
        await addDoc(collection(db!, 'jobs'), {
            ...jobData,
            status: 'Open',
            clientReviewed: false,
            freelancerReviewed: false,
            postedDate: serverTimestamp(),
        });
        return true;
    } catch(error) {
        console.error("Error adding job:", error);
        return false;
    }
  };

  const deleteJob = async (jobId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db!, 'jobs', jobId));
        return true;
    } catch (error) {
        console.error("Error deleting job:", error);
        return false;
    }
  };

  const updateJobStatus = async (jobId: string, status: Job['status']): Promise<boolean> => {
    try {
        await updateDoc(doc(db!, 'jobs', jobId), { status });
        return true;
    } catch (error) {
        console.error("Error updating job status:", error);
        return false;
    }
  };

  const updateJob = async (jobId: string, jobData: Partial<Omit<Job, 'id'>>): Promise<boolean> => {
    try {
        await updateDoc(doc(db!, 'jobs', jobId), jobData);
        return true;
    } catch (error) {
        console.error("Error updating job:", error);
        return false;
    }
  };
  
  const hireFreelancerForJob = async (jobId: string, freelancerId: string): Promise<boolean> => {
    try {
        await updateDoc(doc(db!, 'jobs', jobId), { status: 'InProgress', hiredFreelancerId: freelancerId });
        return true;
    } catch (error) {
        console.error("Error hiring freelancer:", error);
        return false;
    }
  }
  
  const releasePayment = async (jobId: string): Promise<boolean> => {
    try {
        await updateDoc(doc(db!, 'jobs', jobId), { status: 'Completed' });
        return true;
    } catch (error) {
        console.error("Error releasing payment:", error);
        return false;
    }
  };

  const markJobAsReviewed = async (jobId: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    try {
        const fieldToUpdate = role === 'client' ? { clientReviewed: true } : { freelancerReviewed: true };
        await updateDoc(doc(db!, 'jobs', jobId), fieldToUpdate);
        return true;
    } catch (error) {
        console.error("Error marking job as reviewed:", error);
        return false;
    }
  };

  const deleteJobsByClientId = async (clientId: string): Promise<boolean> => {
    console.warn("Deleting jobs by client ID requires a backend function for security.");
    // Placeholder for batch delete logic, ideally done in a Cloud Function
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
