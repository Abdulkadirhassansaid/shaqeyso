
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DirectMessage } from '@/lib/types';
import { useAuth } from './use-auth';

interface DirectMessagesContextType {
  directMessages: DirectMessage[];
  addDirectMessage: (messageData: Omit<DirectMessage, 'id' | 'timestamp'>) => Promise<boolean>;
  deleteDirectMessagesForUser: (userId: string) => Promise<boolean>; // This would require a backend function
}

const DirectMessagesContext = React.createContext<DirectMessagesContextType | null>(null);

export function DirectMessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [directMessages, setDirectMessages] = React.useState<DirectMessage[]>([]);

  React.useEffect(() => {
    if (!user?.id) {
        setDirectMessages([]);
        return;
    };

    const q = query(collection(db!, 'directMessages'), where('participantIds', 'array-contains', user.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
      } as DirectMessage));
      setDirectMessages(messagesData);
    });

    return () => unsubscribe();
  }, [user?.id]);


  const addDirectMessage = async (messageData: Omit<DirectMessage, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!messageData.text?.trim()) {
        return false;
    }
    try {
        await addDoc(collection(db!, 'directMessages'), {
            ...messageData,
            timestamp: serverTimestamp(),
        });
        return true;
    } catch(error) {
        console.error("Error adding direct message:", error);
        return false;
    }
  };
  
  const deleteDirectMessagesForUser = async (userId: string): Promise<boolean> => {
      console.warn("Deleting direct messages requires a backend function for security.");
      // Placeholder for batch delete logic, ideally done in a Cloud Function
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
