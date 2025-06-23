
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
import type { DirectMessage } from '@/lib/types';

interface DirectMessagesContextType {
  directMessages: DirectMessage[];
  addDirectMessage: (messageData: Omit<DirectMessage, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteDirectMessagesForUser: (userId: string) => Promise<boolean>;
}

const DirectMessagesContext = React.createContext<DirectMessagesContextType | null>(null);

export function DirectMessagesProvider({ children }: { children: React.ReactNode }) {
  const [directMessages, setDirectMessages] = React.useState<DirectMessage[]>([]);

  React.useEffect(() => {
    const q = query(collection(db, "directMessages"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: DirectMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DirectMessage));
      setDirectMessages(messagesData);
    });
    return () => unsubscribe();
  }, []);

  const addDirectMessage = async (messageData: Omit<DirectMessage, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim()) {
        return false; // Do not add empty messages
    }
    try {
      const newMessage = {
        ...messageData,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'directMessages'), newMessage);
      return true;
    } catch(e) { return false; }
  };

  const deleteDirectMessagesForUser = async (userId: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'directMessages'), where('participantIds', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch(e) { return false; }
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
