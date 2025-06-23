
'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import type { DirectMessage } from '@/lib/types';
import { mockDirectMessages as initialDirectMessages } from '@/lib/mock-data';

interface DirectMessagesContextType {
  directMessages: DirectMessage[];
  addDirectMessage: (messageData: Omit<DirectMessage, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteDirectMessagesForUser: (userId: string) => Promise<boolean>;
}

const DirectMessagesContext = React.createContext<DirectMessagesContextType | null>(null);

export function DirectMessagesProvider({ children }: { children: React.ReactNode }) {
  const [directMessages, setDirectMessages] = useLocalStorageState('shaqo-direct-messages', initialDirectMessages);

  const addDirectMessage = async (messageData: Omit<DirectMessage, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim()) {
        return false; // Do not add empty messages
    }
    const newMessage: DirectMessage = {
      ...messageData,
      id: `dm-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setDirectMessages(prevMessages => [...prevMessages, newMessage]);
    return true;
  };

  const deleteDirectMessagesForUser = async (userId: string): Promise<boolean> => {
    setDirectMessages(prev => prev.filter(dm => !dm.participantIds.includes(userId)));
    return true;
  }

  const value = { directMessages, addDirectMessage, deleteDirectMessagesForUser };

  return <DirectMessagesContext.Provider value={value}>{children}</DirectMessagesContext.Provider>;
}

export const useDirectMessages = () => {
  const context = React.useContext(DirectMessagesContext);
  if (context === null) {
    throw new Error('useDirectMessages must be used within a DirectMessagesProvider');
  }
  return context;
};
