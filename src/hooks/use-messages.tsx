
'use client';

import * as React from 'react';
import { useLocalStorageState } from './use-local-storage-state';
import type { Message } from '@/lib/types';
import { mockMessages } from '@/lib/mock-data';

interface MessagesContextType {
  messages: Message[];
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteMessagesByJobId: (jobId: string) => Promise<boolean>;
}

const MessagesContext = React.createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useLocalStorageState<Message[]>('all-messages', mockMessages);

  const addMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim() && (!messageData.files || messageData.files.length === 0)) {
        return false; // Do not add empty messages
    }
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      ...messageData,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    return true;
  };
  
  const deleteMessagesByJobId = async (jobId: string): Promise<boolean> => {
      setMessages(prev => prev.filter(m => m.jobId !== jobId));
      return true;
  }

  const value = { messages, addMessage, deleteMessagesByJobId };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export const useMessages = () => {
  const context = React.useContext(MessagesContext);
  if (context === null) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
