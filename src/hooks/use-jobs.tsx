
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Job, Service } from '@/lib/types';

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
  deleteMessagesByJobId: (jobId: string) => Promise<boolean>;
  createJobFromService: (service: Service, freelancerId: string, clientId: string) => Promise<{ success: boolean; jobId?: string }>;
}

const JobsContext = React.createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<Job[]>([]);

  React.useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'jobs'), (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id,
            postedDate: doc.data().postedDate?.toDate()?.toISOString() || new Date().toISOString()
        } as Job));
        setJobs(jobsData);
    }, (error) => {
        console.error("Error fetching jobs:", error);
    });
    return () => unsubscribe();
  }, []);

  const addJob = React.useCallback(async (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId' | 'clientReviewed' | 'freelancerReviewed' | 'postedDate'>): Promise<boolean> => {
    if (!db) return false;
    try {
        await addDoc(collection(db, 'jobs'), {
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
  }, []);

  const createJobFromService = React.useCallback(async (service: Service, freelancerId: string, clientId: string): Promise<{ success: boolean; jobId?: string }> => {
    if (!db) return { success: false };
    try {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7); // Default 1 week deadline

        const newJobData: Omit<Job, 'id' | 'postedDate'> = {
            title: `Service: ${service.title}`,
            description: `This job was automatically created from a service request.\n\nOriginal Service Description:\n${service.description}`,
            category: 'Service Request', // Generic category
            budget: service.price,
            deadline: deadline.toISOString().split('T')[0],
            clientId: clientId,
            status: 'InProgress',
            hiredFreelancerId: freelancerId,
            clientReviewed: false,
            freelancerReviewed: false,
            sourceServiceId: service.id,
        };
        
        const docRef = await addDoc(collection(db, 'jobs'), {
            ...newJobData,
            postedDate: serverTimestamp(),
        });
        return { success: true, jobId: docRef.id };
    } catch(error) {
        console.error("Error creating job from service:", error);
        return { success: false };
    }
  }, []);

  const deleteJob = React.useCallback(async (jobId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'jobs', jobId));
        return true;
    } catch (error) {
        console.error("Error deleting job:", error);
        return false;
    }
  }, []);
  
  const deleteMessagesByJobId = React.useCallback(async (jobId: string): Promise<boolean> => {
    if(!db) return false;
    console.warn("Deleting messages requires a backend function for security, performing client-side for demo.");
    try {
      const q = query(collection(db, "messages"), where("jobId", "==", jobId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting messages by job id", error);
      return false;
    }
  }, []);

  const updateJobStatus = React.useCallback(async (jobId: string, status: Job['status']): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'jobs', jobId), { status });
        return true;
    } catch (error) {
        console.error("Error updating job status:", error);
        return false;
    }
  }, []);

  const updateJob = React.useCallback(async (jobId: string, jobData: Partial<Omit<Job, 'id'>>): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'jobs', jobId), jobData);
        return true;
    } catch (error) {
        console.error("Error updating job:", error);
        return false;
    }
  }, []);
  
  const hireFreelancerForJob = React.useCallback(async (jobId: string, freelancerId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'jobs', jobId), { status: 'InProgress', hiredFreelancerId: freelancerId });
        return true;
    } catch (error) {
        console.error("Error hiring freelancer:", error);
        return false;
    }
  }, []);
  
  const releasePayment = React.useCallback(async (jobId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'jobs', jobId), { status: 'Completed' });
        return true;
    } catch (error) {
        console.error("Error releasing payment:", error);
        return false;
    }
  }, []);

  const markJobAsReviewed = React.useCallback(async (jobId: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    if (!db) return false;
    try {
        const fieldToUpdate = role === 'client' ? { clientReviewed: true } : { freelancerReviewed: true };
        await updateDoc(doc(db, 'jobs', jobId), fieldToUpdate);
        return true;
    } catch (error) {
        console.error("Error marking job as reviewed:", error);
        return false;
    }
  }, []);

  const deleteJobsByClientId = React.useCallback(async (clientId: string): Promise<boolean> => {
    if(!db) return false;
    console.warn("Deleting jobs by client ID requires a backend function for security, performing client-side for demo.");
    try {
      const q = query(collection(db, "jobs"), where("clientId", "==", clientId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error deleting jobs by client id", error);
      return false;
    }
  }, []);

  const value = React.useMemo(() => ({ jobs, addJob, deleteJob, updateJobStatus, updateJob, hireFreelancerForJob, releasePayment, markJobAsReviewed, deleteJobsByClientId, deleteMessagesByJobId, createJobFromService }), [jobs, addJob, deleteJob, updateJobStatus, updateJob, hireFreelancerForJob, releasePayment, markJobAsReviewed, deleteJobsByClientId, deleteMessagesByJobId, createJobFromService]);

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export const useJobs = () => {
  const context = React.useContext(JobsContext);
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};

    