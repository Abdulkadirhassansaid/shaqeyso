'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { mockProposals as initialProposals } from '@/lib/mock-data';
import type { Proposal } from '@/lib/types';

interface ProposalsContextType {
  proposals: Proposal[];
  addProposal: (proposalData: Omit<Proposal, 'id'>) => Promise<boolean>;
}

const ProposalsContext = React.createContext<ProposalsContextType | null>(null);

export function ProposalsProvider({ children }: { children: React.ReactNode }) {
  const [proposals, setProposals] = useLocalStorageState('shaqo-proposals', initialProposals);

  const addProposal = async (proposalData: Omit<Proposal, 'id'>): Promise<boolean> => {
    const newProposal: Proposal = {
      ...proposalData,
      id: `prop-${Date.now()}`,
    };
    setProposals(prevProposals => [newProposal, ...prevProposals]);
    return true;
  };

  const value = { proposals, addProposal };

  return <ProposalsContext.Provider value={value}>{children}</ProposalsContext.Provider>;
}

export const useProposals = () => {
  const context = React.useContext(ProposalsContext);
  if (context === null) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
};
