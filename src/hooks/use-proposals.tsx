
'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { mockProposals as initialProposals } from '@/lib/mock-data';
import type { Proposal } from '@/lib/types';

interface ProposalsContextType {
  proposals: Proposal[];
  addProposal: (proposalData: Omit<Proposal, 'id' | 'status'>) => Promise<boolean>;
  acceptProposal: (proposalId: string, jobId: string) => Promise<boolean>;
  updateProposal: (proposalId: string, data: Partial<Pick<Proposal, 'coverLetter' | 'proposedRate'>>) => Promise<boolean>;
  deleteProposal: (proposalId: string) => Promise<boolean>;
}

const ProposalsContext = React.createContext<ProposalsContextType | null>(null);

export function ProposalsProvider({ children }: { children: React.ReactNode }) {
  const [proposals, setProposals] = useLocalStorageState('shaqo-proposals', initialProposals);

  const addProposal = async (proposalData: Omit<Proposal, 'id' | 'status'>): Promise<boolean> => {
    const newProposal: Proposal = {
      ...proposalData,
      id: `prop-${Date.now()}`,
      status: 'Pending',
    };
    setProposals(prevProposals => [newProposal, ...prevProposals]);
    return true;
  };

  const acceptProposal = async (proposalId: string, jobId: string): Promise<boolean> => {
    setProposals(prevProposals => 
        prevProposals.map(p => {
            if (p.jobId !== jobId) return p;
            if (p.id === proposalId) return { ...p, status: 'Accepted' };
            return { ...p, status: 'Rejected' };
        })
    );
    return true;
  };

  const updateProposal = async (proposalId: string, data: Partial<Pick<Proposal, 'coverLetter' | 'proposedRate'>>): Promise<boolean> => {
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, ...data } : p));
    return true;
  }

  const deleteProposal = async (proposalId: string): Promise<boolean> => {
    setProposals(prev => prev.filter(p => p.id !== proposalId));
    return true;
  }

  const value = { proposals, addProposal, acceptProposal, updateProposal, deleteProposal };

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export const useProposals = () => {
  const context = React.useContext(ProposalsContext);
  if (context === null) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
};
