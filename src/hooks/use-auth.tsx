
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
    mockUsers as initialUsers, 
    mockFreelancerProfiles as initialFreelancerProfiles, 
    mockClientProfiles as initialClientProfiles
} from '@/lib/mock-data';
import type { User, FreelancerProfile, ClientProfile, PaymentMethod, Transaction } from '@/lib/types';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer') => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>) => Promise<boolean>;
  users: User[];
  freelancerProfiles: FreelancerProfile[];
  clientProfiles: ClientProfile[];
  addPaymentMethod: (userId: string, method: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (userId: string, methodId: string) => Promise<boolean>;
  addTransaction: (userId: string, transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  toggleUserBlockStatus: (userId: string) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useLocalStorageState('shaqo-users', initialUsers);
  const [freelancerProfiles, setFreelancerProfiles] = useLocalStorageState('shaqo-freelancer-profiles', initialFreelancerProfiles);
  const [clientProfiles, setClientProfiles] = useLocalStorageState('shaqo-client-profiles', initialClientProfiles);
  
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();


  React.useEffect(() => {
    const adminExists = users.some(u => u.email === 'admin@shaqohub.com');
    if (!adminExists) {
      const adminUser = initialUsers.find(u => u.email === 'admin@shaqohub.com');
      if (adminUser) {
        setUsers(currentUsers => {
          if (currentUsers.some(u => u.email === 'admin@shaqohub.com')) {
            return currentUsers;
          }
          return [...currentUsers, adminUser];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // This effect runs on mount to get the initial user from storage,
    // and also syncs state if it's changed in another browser tab.
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const loggedInUser = users.find((u) => u.id === storedUserId);
        if (loggedInUser) {
          if (loggedInUser.isBlocked) {
             localStorage.removeItem('userId');
             setUser(null);
          } else {
             setUser(loggedInUser);
          }
        } else {
            localStorage.removeItem('userId');
            setUser(null);
        }
      }
    } catch (error) {
        console.error("Could not access local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, [users]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }> => {
    const foundUser = users.find(
      (u) => u.email === email && u.password === pass
    );
    if (foundUser) {
      if (foundUser.isBlocked) {
        return { success: false, message: 'blocked' };
      }
      setUser(foundUser);
      localStorage.setItem('userId', foundUser.id);
      return { success: true, user: foundUser };
    }
    return { success: false, message: 'invalid' };
  };

  const signup = async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return false; // User already exists
    }
    const newId = `user-${Date.now()}`;
    
    let initialTransactions: Transaction[] = [];
    if (role === 'client') {
        initialTransactions.push({ 
            id: `txn-${Date.now()}`, 
            date: new Date().toISOString(), 
            description: 'Initial account funding', 
            amount: 5000, 
            status: 'Completed' 
        });
    }

    const newUser: User = {
      id: newId,
      name,
      email,
      password: pass,
      role,
      avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
      paymentMethods: [],
      transactions: initialTransactions,
      isBlocked: false,
    };
    
    setUsers(prev => [...prev, newUser]);
    
    if (role === 'freelancer') {
        setFreelancerProfiles(prev => [...prev, {
            userId: newId,
            skills: [],
            bio: '',
            hourlyRate: 0,
            portfolio: [],
        }]);
    } else {
        setClientProfiles(prev => [...prev, {
            userId: newId,
            companyName: name,
            projectsPosted: [],
        }]);
    }

    setUser(newUser);
    localStorage.setItem('userId', newUser.id);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const updateUserProfile = async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
    let updatedUser: User | undefined;
    const newUsers = users.map(u => {
        if (u.id === userId) {
            updatedUser = { ...u, ...userData };
            return updatedUser;
        }
        return u;
    });
    setUsers(newUsers);

    if (user?.id === userId && updatedUser) {
      setUser(updatedUser);
    }

    if (profileData) {
        const targetUser = users.find(u => u.id === userId);
        if (targetUser?.role === 'freelancer') {
            setFreelancerProfiles(prevProfiles => {
                return prevProfiles.map(p => p.userId === userId ? { ...p, ...profileData } : p);
            });
        } else if (targetUser?.role === 'client') {
            setClientProfiles(prevProfiles => {
                return prevProfiles.map(p => p.userId === userId ? { ...p, ...profileData } : p);
            });
        }
    }
    
    return true;
  };

  const addPaymentMethod = async (userId: string, method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
    let updatedUser: User | undefined;
    const newUsers = users.map(u => {
        if (u.id === userId) {
            const newMethod = { ...method, id: `pm-${Date.now()}` };
            updatedUser = { ...u, paymentMethods: [...(u.paymentMethods || []), newMethod] };
            return updatedUser;
        }
        return u;
    });
    setUsers(newUsers);

    if (user?.id === userId && updatedUser) {
      setUser(updatedUser);
    }
    return true;
  };

  const removePaymentMethod = async (userId: string, methodId: string): Promise<boolean> => {
    let updatedUser: User | undefined;
    const newUsers = users.map(u => {
        if (u.id === userId) {
            const paymentMethods = (u.paymentMethods || []).filter(pm => pm.id !== methodId);
            updatedUser = { ...u, paymentMethods };
            return updatedUser;
        }
        return u;
    });
    setUsers(newUsers);
    
    if (user?.id === userId && updatedUser) {
      setUser(updatedUser);
    }
    return true;
  };

  const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
     let updatedUser: User | undefined;
     const newUsers = users.map(u => {
        if (u.id === userId) {
            const newTransaction = { ...transaction, id: `txn-${Date.now()}`, date: new Date().toISOString() };
            updatedUser = { ...u, transactions: [...(u.transactions || []), newTransaction] };
            return updatedUser;
        }
        return u;
    });
    setUsers(newUsers);

    if (user?.id === userId && updatedUser) {
      setUser(updatedUser);
    }
    return true;
  };
  
  const toggleUserBlockStatus = async (userId: string): Promise<boolean> => {
    const newUsers = users.map(u => 
        u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u
    );
    setUsers(newUsers);

    if (user?.id === userId && newUsers.find(u => u.id === userId)?.isBlocked) {
        logout();
    }
    return true;
  };

  const value = { user, isLoading, login, logout, signup, updateUserProfile, users, freelancerProfiles, clientProfiles, addPaymentMethod, removePaymentMethod, addTransaction, toggleUserBlockStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
