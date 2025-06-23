
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import type { Message } from '@/lib/types';

interface MessagesContextType {
  messages: Message[];
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteMessagesByJobId: (jobId: string) => Promise<boolean>;
}

const MessagesContext = React.createContext<MessagesContextType | null>(null);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<Message[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "messages"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(messagesData);
    });
    return () => unsubscribe();
  }, []);

  const addMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim() && (!messageData.files || messageData.files.length === 0)) {
        return false; // Do not add empty messages
    }
    try {
      const newMessage = {
        ...messageData,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'messages'), newMessage);
      return true;
    } catch(e) { return false; }
  };

  const deleteMessagesByJobId = async (jobId: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'messages'), where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch(e) { return false; }
  };

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
