
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Proposal } from '@/lib/types';
import { useAuth } from './use-auth';

interface ProposalsContextType {
  proposals: Proposal[];
  addProposal: (proposalData: Omit<Proposal, 'id' | 'status'>) => Promise<boolean>;
  acceptProposal: (proposalId: string, jobId: string) => Promise<boolean>;
  updateProposal: (proposalId: string, data: Partial<Pick<Proposal, 'coverLetter' | 'proposedRate'>>) => Promise<boolean>;
  deleteProposal: (proposalId: string) => Promise<boolean>;
  deleteProposalsByJobId: (jobId: string) => Promise<boolean>;
  deleteProposalsByFreelancerId: (freelancerId: string) => Promise<boolean>;
}

const ProposalsContext = React.createContext<ProposalsContextType | null>(null);

export function ProposalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [proposals, setProposals] = React.useState<Proposal[]>([]);

   React.useEffect(() => {
    if (!db || !user) {
        setProposals([]);
        return;
    };

    let unsubscribe: () => void = () => {};

    const setupListener = async () => {
        if (user.role === 'freelancer') {
            const q = query(collection(db, 'proposals'), where('freelancerId', '==', user.id));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const proposalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Proposal));
                setProposals(proposalsData);
            }, (error) => {
                console.error("Error fetching freelancer proposals:", error);
            });
        } else if (user.role === 'client') {
            const jobsQuery = query(collection(db, 'jobs'), where('clientId', '==', user.id));
            const jobsSnapshot = await getDocs(jobsQuery);
            const clientJobIds = jobsSnapshot.docs.map(doc => doc.id);

            if (clientJobIds.length > 0) {
                const q = query(collection(db, 'proposals'), where('jobId', 'in', clientJobIds.slice(0, 30)));
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const proposalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Proposal));
                    setProposals(proposalsData);
                }, (error) => {
                    console.error("Error fetching client proposals:", error);
                });
            } else {
                setProposals([]);
            }
        } else { // Admin role fetches all proposals
             const q = query(collection(db, 'proposals'));
             getDocs(q).then(snapshot => {
                const proposalsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Proposal));
                setProposals(proposalsData);
             }).catch(error => {
                console.error("Error fetching proposals for admin:", error);
             })
             unsubscribe = () => {};
        }
    };

    setupListener();
    
    return () => unsubscribe();
  }, [user]);

  const addProposal = React.useCallback(async (proposalData: Omit<Proposal, 'id' | 'status'>): Promise<boolean> => {
    if (!db) return false;
    try {
        await addDoc(collection(db, 'proposals'), {
            ...proposalData,
            status: 'Pending',
        });
        return true;
    } catch(error) {
        console.error("Error adding proposal:", error);
        return false;
    }
  }, []);
  
  const acceptProposal = React.useCallback(async (proposalId: string, jobId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const q = query(collection(db, 'proposals'), where('jobId', '==', jobId));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.forEach(doc => {
            if (doc.id === proposalId) {
                batch.update(doc.ref, { status: 'Accepted' });
            } else {
                batch.update(doc.ref, { status: 'Rejected' });
            }
        });
        
        await batch.commit();
        return true;
    } catch(error) {
        console.error("Error accepting proposal:", error);
        return false;
    }
  }, []);

  const updateProposal = React.useCallback(async (proposalId: string, data: Partial<Pick<Proposal, 'coverLetter' | 'proposedRate'>>): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'proposals', proposalId), data);
        return true;
    } catch(error) {
        console.error("Error updating proposal:", error);
        return false;
    }
  }, []);

  const deleteProposal = React.useCallback(async (proposalId: string): Promise<boolean> => {
      if (!db) return false;
      try {
          await deleteDoc(doc(db, 'proposals', proposalId));
          return true;
      } catch (error) {
          console.error("Error deleting proposal:", error);
          return false;
      }
  }, []);

  const deleteProposalsByJobId = React.useCallback(async (jobId: string): Promise<boolean> => {
      if(!db) return false;
      console.warn("Deleting proposals requires a backend function for security, performing client-side for demo.");
      try {
        const q = query(collection(db, "proposals"), where("jobId", "==", jobId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return true;
      } catch(error) {
        console.error("Error deleting proposals by job id", error);
        return false;
      }
  }, []);

  const deleteProposalsByFreelancerId = React.useCallback(async (freelancerId: string): Promise<boolean> => {
      if(!db) return false;
      console.warn("Deleting proposals requires a backend function for security, performing client-side for demo.");
      try {
        const q = query(collection(db, "proposals"), where("freelancerId", "==", freelancerId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return true;
      } catch(error) {
        console.error("Error deleting proposals by freelancer id", error);
        return false;
      }
  }, []);

  const value = React.useMemo(() => ({ proposals, addProposal, acceptProposal, updateProposal, deleteProposal, deleteProposalsByJobId, deleteProposalsByFreelancerId }), [proposals, addProposal, acceptProposal, updateProposal, deleteProposal, deleteProposalsByJobId, deleteProposalsByFreelancerId]);

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export const useProposals = () => {
  const context = React.useContext(ProposalsContext);
  if (context === null) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
};
