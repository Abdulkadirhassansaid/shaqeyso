
'use client';

import * as React from 'react';
import { useLocalStorageState } from './use-local-storage-state';
import type { Proposal } from '@/lib/types';
import { mockProposals } from '@/lib/mock-data';

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
  const [proposals, setProposals] = useLocalStorageState<Proposal[]>('all-proposals', mockProposals);

  const addProposal = async (proposalData: Omit<Proposal, 'id' | 'status'>): Promise<boolean> => {
    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      ...proposalData,
      status: 'Pending',
    };
    setProposals(prev => [...prev, newProposal]);
    return true;
  };
  
  const acceptProposal = async (proposalId: string, jobId: string): Promise<boolean> => {
      setProposals(prev => prev.map(p => {
          if (p.jobId === jobId) {
              return p.id === proposalId ? { ...p, status: 'Accepted' } : { ...p, status: 'Rejected' };
          }
          return p;
      }));
      return true;
  }

  const updateProposal = async (proposalId: string, data: Partial<Pick<Proposal, 'coverLetter' | 'proposedRate'>>): Promise<boolean> => {
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, ...data } : p));
    return true;
  }

  const deleteProposal = async (proposalId: string): Promise<boolean> => {
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      return true;
  }

  const deleteProposalsByJobId = async (jobId: string): Promise<boolean> => {
      setProposals(prev => prev.filter(p => p.jobId !== jobId));
      return true;
  }

  const deleteProposalsByFreelancerId = async (freelancerId: string): Promise<boolean> => {
      setProposals(prev => prev.filter(p => p.freelancerId !== freelancerId));
      return true;
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
