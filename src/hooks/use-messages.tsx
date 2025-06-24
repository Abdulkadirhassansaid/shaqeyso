
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';

interface MessagesContextType {
  messages: Message[];
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteMessagesByJobId: (jobId: string) => Promise<boolean>; // This would require a backend function
}

const MessagesContext = React.createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<Message[]>([]);

  React.useEffect(() => {
    // Note: This listens to ALL messages. In a production app with many messages,
    // you would want to scope this query, for example, to only the jobs the current user is involved in.
    const q = query(collection(db!, 'messages'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
      } as Message));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, []);

  const addMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim() && (!messageData.files || messageData.files.length === 0)) {
        return false;
    }
    try {
        await addDoc(collection(db!, 'messages'), {
            ...messageData,
            timestamp: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error("Error adding message:", error);
        return false;
    }
  };
  
  const deleteMessagesByJobId = async (jobId: string): Promise<boolean> => {
      console.warn("Deleting messages requires a backend function for security.");
      // Placeholder for batch delete logic, ideally done in a Cloud Function
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
