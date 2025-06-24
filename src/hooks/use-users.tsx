
'use client';

import * as React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

interface UsersContextType {
  users: User[];
  isUsersLoading: boolean;
}

const UsersContext = React.createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = React.useState(true);

  React.useEffect(() => {
    if (!db) {
        setIsUsersLoading(false);
        return;
    };

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsUsersLoading(false);
        }
    };

    fetchUsers();
    
  }, []);

  const value = React.useMemo(() => ({ users, isUsersLoading }), [users, isUsersLoading]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export const useUsers = () => {
  const context = React.useContext(UsersContext);
  if (context === null) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
