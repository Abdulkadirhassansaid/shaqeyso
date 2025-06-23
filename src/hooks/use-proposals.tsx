
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
import type { Proposal } from '@/lib/types';

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
  const [proposals, setProposals] = React.useState<Proposal[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "proposals"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const proposalsData: Proposal[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Proposal));
      setProposals(proposalsData);
    });
    return () => unsubscribe();
  }, []);

  const addProposal = async (proposalData: Omit<Proposal, 'id' | 'status'>): Promise<boolean> => {
    try {
      const newProposal = {
        ...proposalData,
        status: 'Pending' as const,
      };
      await addDoc(collection(db, 'proposals'), newProposal);
      return true;
    } catch(e) { return false; }
  };

  const acceptProposal = async (proposalId: string, jobId: string): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      // Reject all other proposals for the same job
      const q = query(collection(db, "proposals"), where("jobId", "==", jobId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((document) => {
        if (document.id !== proposalId) {
          batch.update(document.ref, { status: 'Rejected' });
        }
      });
      // Accept the selected proposal
      batch.update(doc(db, 'proposals', proposalId), { status: 'Accepted' });
      
      await batch.commit();
      return true;
    } catch(e) { return false; }
  };

  const updateProposal = async (proposalId: string, data: Partial<Pick<Proposal, 'coverLetter' | 'proposedRate'>>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'proposals', proposalId), data);
      return true;
    } catch(e) { return false; }
  }

  const deleteProposal = async (proposalId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'proposals', proposalId));
      return true;
    } catch(e) { return false; }
  }

  const deleteProposalsByJobId = async (jobId: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "proposals"), where("jobId", "==", jobId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch(e) { return false; }
  }

  const deleteProposalsByFreelancerId = async (freelancerId: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "proposals"), where("freelancerId", "==", freelancerId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch(e) { return false; }
  }

  const value = { proposals, addProposal, acceptProposal, updateProposal, deleteProposal, deleteProposalsByJobId, deleteProposalsByFreelancerId };

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export const useProposals = () => {
  const context = React.useContext(ProposalsContext);
  if (context === null) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
};
