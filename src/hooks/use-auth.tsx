
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
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer') => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>) => Promise<boolean>;
  users: User[];
  freelancerProfiles: FreelancerProfile[];
  clientProfiles: ClientProfile[];
  addPaymentMethod: (userId: string, method: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (userId: string, methodId: string) => Promise<boolean>;
  addTransaction: (userId: string, transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  refreshUser: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useLocalStorageState('shaqo-users', initialUsers);
  const [freelancerProfiles, setFreelancerProfiles] = useLocalStorageState('shaqo-freelancer-profiles', initialFreelancerProfiles);
  const [clientProfiles, setClientProfiles] = useLocalStorageState('shaqo-client-profiles', initialClientProfiles);
  
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const refreshUser = React.useCallback(() => {
    const currentUserId = user?.id;
    if (currentUserId) {
        const refreshedUser = users.find(u => u.id === currentUserId);
        if (refreshedUser) {
            setUser(refreshedUser);
        }
    }
  }, [user, users]);

  React.useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const loggedInUser = users.find((u) => u.id === storedUserId);
        if (loggedInUser) {
          setUser(loggedInUser);
        } else {
            localStorage.removeItem('userId');
        }
      }
    } catch (error) {
        console.error("Could not access local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, [users]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const foundUser = users.find(
      (u) => u.email === email && u.password === pass
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('userId', foundUser.id);
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return false; // User already exists
    }
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name,
      email,
      password: pass,
      role,
      avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
      paymentMethods: [],
      transactions: [],
      balance: role === 'client' ? 5000 : 0, // Give clients a starting balance
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

  const updateUserProfile = async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
    let updatedUser: User | null = null;
    
    setUsers(prevUsers => {
        const userIndex = prevUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) return prevUsers;
        
        const newUsers = [...prevUsers];
        updatedUser = { ...newUsers[userIndex], ...userData };
        newUsers[userIndex] = updatedUser;
        
        setUser(updatedUser);
        return newUsers;
    });

    if (!updatedUser) return false;

    if (profileData) {
        if (updatedUser.role === 'freelancer') {
            setFreelancerProfiles(prevProfiles => {
                const profileIndex = prevProfiles.findIndex(p => p.userId === userId);
                const newProfiles = [...prevProfiles];
                if (profileIndex !== -1) {
                    newProfiles[profileIndex] = { ...newProfiles[profileIndex], ...(profileData as Partial<FreelancerProfile>) };
                }
                return newProfiles;
            });
        } else {
            setClientProfiles(prevProfiles => {
                const profileIndex = prevProfiles.findIndex(p => p.userId === userId);
                const newProfiles = [...prevProfiles];
                if (profileIndex !== -1) {
                    newProfiles[profileIndex] = { ...newProfiles[profileIndex], ...(profileData as Partial<ClientProfile>) };
                }
                return newProfiles;
            });
        }
    }
    
    return true;
  };

  const addPaymentMethod = async (userId: string, method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId) {
                const newMethod = { ...method, id: `pm-${Date.now()}` };
                const paymentMethods = [...(u.paymentMethods || []), newMethod];
                const updatedUser = { ...u, paymentMethods };
                if (user?.id === userId) setUser(updatedUser);
                return updatedUser;
            }
            return u;
        });
    });
    return true;
  };

  const removePaymentMethod = async (userId: string, methodId: string): Promise<boolean> => {
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId) {
                const paymentMethods = (u.paymentMethods || []).filter(pm => pm.id !== methodId);
                const updatedUser = { ...u, paymentMethods };
                 if (user?.id === userId) setUser(updatedUser);
                return updatedUser;
            }
            return u;
        });
    });
    return true;
  };

  const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId) {
                const newTransaction = { ...transaction, id: `txn-${Date.now()}`, date: new Date().toISOString() };
                const transactions = [...(u.transactions || []), newTransaction];
                let updatedUser = { ...u, transactions };

                if (u.role === 'client') {
                    const newBalance = (u.balance || 0) + newTransaction.amount;
                    updatedUser = { ...updatedUser, balance: newBalance };
                }

                if (user?.id === userId) setUser(updatedUser);
                return updatedUser;
            }
            return u;
        });
    });
    return true;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const value = { user, isLoading, login, logout, signup, updateUserProfile, users, freelancerProfiles, clientProfiles, addPaymentMethod, removePaymentMethod, addTransaction, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
