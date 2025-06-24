
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorageState } from './use-local-storage-state';
import type { User, FreelancerProfile, ClientProfile, PaymentMethod, Transaction } from '@/lib/types';
import { mockUsers, mockFreelancerProfiles, mockClientProfiles } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer') => Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'unknown' }>;
  logout: () => void;
  updateUserProfile: (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>) => Promise<boolean>;
  users: User[];
  freelancerProfiles: FreelancerProfile[];
  clientProfiles: ClientProfile[];
  addPaymentMethod: (userId: string, method: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (userId: string, methodId: string) => Promise<boolean>;
  addTransaction: (userId: string, transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  toggleUserBlockStatus: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  submitVerification: (userId: string, documents: { passportOrIdUrl: string; businessCertificateUrl?: string }) => Promise<boolean>;
  approveVerification: (userId: string) => Promise<boolean>;
  rejectVerification: (userId: string, reason: string) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useLocalStorageState<User | null>('auth-user', null);
    const [users, setUsers] = useLocalStorageState<User[]>('all-users', mockUsers);
    const [freelancerProfiles, setFreelancerProfiles] = useLocalStorageState<FreelancerProfile[]>('freelancer-profiles', mockFreelancerProfiles);
    const [clientProfiles, setClientProfiles] = useLocalStorageState<ClientProfile[]>('client-profiles', mockClientProfiles);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        // Simulate loading for a moment to prevent flashes of content
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
    }, [user]);

    const login = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }> => {
        // @ts-ignore
        const foundUser = users.find(u => u.email === email && u.password === pass);
        if (foundUser) {
            if (foundUser.isBlocked) {
                return { success: false, message: 'blocked' };
            }
            setUser(foundUser);
            return { success: true, user: foundUser };
        }
        return { success: false, message: 'invalid' };
    };

    const signup = async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'unknown' }> => {
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'email-in-use' };
        }
        
        const isFirstAdmin = email.toLowerCase() === 'abdikadirhassan2015@gmail.com';
        const userRole = isFirstAdmin ? 'admin' : role;
        
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
            role: userRole,
            paymentMethods: [],
            transactions: role === 'client' ? [{
                id: `txn-${Date.now()}`, 
                date: new Date().toISOString(), 
                description: 'Initial account funding', 
                amount: 5000, 
                status: 'Completed' 
            }] : [],
            isBlocked: false,
            verificationStatus: 'unverified',
            // @ts-ignore
            password: pass,
        };

        setUsers(prev => [...prev, newUser]);
        
        if (role === 'freelancer') {
            setFreelancerProfiles(prev => [...prev, { userId: newUser.id, skills: [], bio: '', hourlyRate: 0, portfolio: [] }]);
        } else if (role === 'client') {
            setClientProfiles(prev => [...prev, { userId: newUser.id, companyName: name, projectsPosted: [] }]);
        }
        
        setUser(newUser);
        return { success: true, user: newUser };
    };

    const logout = () => {
        setUser(null);
        router.push('/login');
    };

    const updateUserProfile = async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...userData } : u));
        if (user && user.id === userId) {
            setUser(prev => prev ? { ...prev, ...userData } : null);
        }
        if (profileData) {
            const userToUpdate = users.find(u => u.id === userId);
            if (userToUpdate?.role === 'freelancer') {
                setFreelancerProfiles(prev => prev.map(p => p.userId === userId ? { ...p, ...profileData as FreelancerProfile } : p));
            } else if (userToUpdate?.role === 'client') {
                setClientProfiles(prev => prev.map(p => p.userId === userId ? { ...p, ...profileData as ClientProfile } : p));
            }
        }
        return true;
    };
    
    const submitVerification = async (userId: string, documents: { passportOrIdUrl: string; businessCertificateUrl?: string }): Promise<boolean> => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: 'pending', ...documents, verificationRejectionReason: undefined } : u));
        if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, verificationStatus: 'pending', ...documents, verificationRejectionReason: undefined } : null);
        }
        return true;
    };

    const approveVerification = async (userId: string): Promise<boolean> => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: 'verified' } : u));
        if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, verificationStatus: 'verified' } : null);
        }
        return true;
    };

    const rejectVerification = async (userId: string, reason: string): Promise<boolean> => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: 'rejected', verificationRejectionReason: reason } : u));
         if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, verificationStatus: 'rejected', verificationRejectionReason: reason } : null);
        }
        return true;
    };

    const addPaymentMethod = async (userId: string, method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
        const newMethod = { ...method, id: `pm-${Date.now()}` };
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, paymentMethods: [...(u.paymentMethods || []), newMethod] } : u));
        if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, paymentMethods: [...(prev.paymentMethods || []), newMethod] } : null);
        }
        return true;
    };

    const removePaymentMethod = async (userId: string, methodId: string): Promise<boolean> => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, paymentMethods: u.paymentMethods?.filter(pm => pm.id !== methodId) } : u));
        if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, paymentMethods: prev.paymentMethods?.filter(pm => pm.id !== methodId) } : null);
        }
        return true;
    };

    const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
        const newTransaction = { ...transaction, id: `txn-${Date.now()}`, date: new Date().toISOString() };
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, transactions: [...(u.transactions || []), newTransaction] } : u));
        if (user?.id === userId) {
            setUser(prev => prev ? { ...prev, transactions: [...(prev.transactions || []), newTransaction] } : null);
        }
        return true;
    };

    const toggleUserBlockStatus = async (userId: string): Promise<boolean> => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
        return true;
    };

    const deleteUser = async (userId: string): Promise<boolean> => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setFreelancerProfiles(prev => prev.filter(p => p.userId !== userId));
        setClientProfiles(prev => prev.filter(p => p.userId !== userId));
        return true;
    };

    const value = { user, isLoading, login, logout, signup, updateUserProfile, users, freelancerProfiles, clientProfiles, addPaymentMethod, removePaymentMethod, addTransaction, toggleUserBlockStatus, deleteUser, submitVerification, approveVerification, rejectVerification };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
