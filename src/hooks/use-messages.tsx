
'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import type { Message } from '@/lib/types';
import { mockMessages as initialMessages } from '@/lib/mock-data';

interface MessagesContextType {
  messages: Message[];
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<boolean>;
}

const MessagesContext = React.createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useLocalStorageState('shaqo-messages', initialMessages);

  const addMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<boolean> => {
    const newMessage: Message = {
      ...messageData,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    return true;
  };

  const value = { messages, addMessage };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export const useMessages = () => {
  const context = React.useContext(MessagesContext);
  if (context === null) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
};
