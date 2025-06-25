
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, getDocs, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Job, Service, User, Transaction } from '@/lib/types';
import { addDays, format } from 'date-fns';

interface JobsContextType {
  jobs: Job[];
  addJob: (jobData: Omit<Job, 'id' | 'status' | 'hiredFreelancerId' | 'clientReviewed' | 'freelancerReviewed' | 'postedDate'>) => Promise<boolean>;
  deleteJob: (jobId: string) => Promise<boolean>;
  updateJobStatus: (jobId: string, status: Job['status']) => Promise<boolean>;
  updateJob: (jobId: string, jobData: Partial<Omit<Job, 'id'>>) => Promise<boolean>;
  hireFreelancerForJob: (jobId: string, freelancerId: string) => Promise<boolean>;
  markJobAsReviewed: (jobId: string, role: 'client' | 'freelancer') => Promise<boolean>;
  deleteJobsByClientId: (clientId: string) => Promise<boolean>;
  deleteMessagesByJobId: (jobId: string) => Promise<boolean>;
  createJobFromService: (clientId: string, freelancerId: string, service: Service, tier: 'standard' | 'fast') => Promise<{ success: boolean; message?: string }>;
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
    console.warn("Deleting subcollections client-side is not recommended for production. Use a Cloud Function. This is a demo implementation.");
    try {
      const messagesRef = collection(db, 'jobs', jobId, 'messages');
      const q = query(messagesRef);
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

  const createJobFromService = React.useCallback(async (
    clientId: string,
    freelancerId: string,
    service: Service,
    tier: 'standard' | 'fast'
  ): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not connected." };
    
    const price = tier === 'fast' && service.fastDelivery ? service.fastDelivery.price : service.price;
    const deliveryTime = tier === 'fast' && service.fastDelivery ? service.fastDelivery.days : service.deliveryTime;

    if (typeof price !== 'number' || typeof deliveryTime !== 'number' || isNaN(deliveryTime)) {
        console.error("Invalid service pricing or delivery information.", service);
        return { success: false, message: "Invalid service pricing or delivery information." };
    }

    const clientRef = doc(db, 'users', clientId);
    const clientSnap = await getDoc(clientRef);

    if (!clientSnap.exists()) {
        return { success: false, message: "Client not found." };
    }

    const clientData = clientSnap.data() as User;
    const clientBalance = (clientData.transactions || []).reduce((acc, tx) => acc + tx.amount, 0);

    if (clientBalance < price) {
        return { success: false, message: "Insufficient funds. Please top up your balance." };
    }
    
    const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
    const adminSnapshot = await getDocs(adminQuery);
    if (adminSnapshot.empty) {
      return { success: false, message: "Admin account not found. Cannot process payment." };
    }
    const adminUserRef = adminSnapshot.docs[0].ref;

    const deadline = addDays(new Date(), deliveryTime);

    const newJobData = {
        title: `Service Order: ${service.title}`,
        description: `This job was automatically created from a service request.\n\nService Description:\n${service.description}`,
        category: 'Service Request',
        budget: price,
        deadline: format(deadline, 'yyyy-MM-dd'),
        clientId: clientId,
        status: 'InProgress' as Job['status'],
        hiredFreelancerId: freelancerId,
        postedDate: serverTimestamp(),
        sourceServiceId: service.id,
        sourceServiceTitle: service.title,
        clientReviewed: false,
        freelancerReviewed: false,
    };
    
    try {
        await runTransaction(db, async (transaction) => {
            const adminDoc = await transaction.get(adminUserRef);
            if (!adminDoc.exists()) {
                throw new Error("Admin user document not found.");
            }
            
            // Create the new job
            const jobRef = doc(collection(db, 'jobs'));
            transaction.set(jobRef, newJobData);

            // Debit client
            const clientTransactions = clientSnap.data()?.transactions || [];
            const newClientTransactions = [...clientTransactions, {
                id: `txn-client-${Date.now()}`,
                date: new Date().toISOString(),
                description: `Payment for "${service.title}"`,
                amount: -price,
                status: 'Completed',
            }];
            transaction.update(clientRef, { transactions: newClientTransactions });
            
            // Credit admin/platform for escrow
            const adminTransactions = adminDoc.data()?.transactions || [];
            const newAdminTransactions = [...adminTransactions, {
                id: `txn-escrow-${Date.now()}`,
                date: new Date().toISOString(),
                description: `Escrow for job: "${service.title}"`,
                amount: price,
                status: 'Completed',
            }];
            transaction.update(adminUserRef, { transactions: newAdminTransactions });
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating job from service:", error);
        return { success: false, message: (error as Error).message || "An unexpected error occurred." };
    }
  }, []);

  const value = React.useMemo(() => ({ jobs, addJob, deleteJob, updateJobStatus, updateJob, hireFreelancerForJob, markJobAsReviewed, deleteJobsByClientId, deleteMessagesByJobId, createJobFromService }), [jobs, addJob, deleteJob, updateJobStatus, updateJob, hireFreelancerForJob, markJobAsReviewed, deleteJobsByClientId, deleteMessagesByJobId, createJobFromService]);

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export const useJobs = () => {
  const context = React.useContext(JobsContext);
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};
