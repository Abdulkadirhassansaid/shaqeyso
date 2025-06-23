
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  type User as AuthUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  query
} from 'firebase/firestore';
import type { User, FreelancerProfile, ClientProfile, PaymentMethod, Transaction } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer') => Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }>;
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
  const [user, setUser] = React.useState<User | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [freelancerProfiles, setFreelancerProfiles] = React.useState<FreelancerProfile[]>([]);
  const [clientProfiles, setClientProfiles] = React.useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setIsLoading(true);
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userProfile = { id: userDoc.id, ...userDoc.data() } as User;
          if (userProfile.isBlocked) {
            await signOut(auth);
            setUser(null);
          } else {
            setUser(userProfile);
          }
        } else {
          // This case can happen in a race condition during signup.
          // We will let it be null for now, the signup flow will handle the redirect.
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, "freelancerProfiles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFreelancerProfiles(snapshot.docs.map(doc => doc.data() as FreelancerProfile));
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, "clientProfiles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClientProfiles(snapshot.docs.map(doc => doc.data() as ClientProfile));
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userProfile = { id: userDoc.id, ...userDoc.data() } as User;
        if (userProfile.isBlocked) {
          await signOut(auth);
          return { success: false, message: 'blocked' };
        }
        return { success: true, user: userProfile };
      }
      return { success: false, message: 'invalid' };
    } catch (error) {
      return { success: false, message: 'invalid' };
    }
  };

  const signup = async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const authUser = userCredential.user;

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
      
      const userRole = email === 'abdikadirhassan2015@gmail.com' ? 'admin' : role;

      const newUser: Omit<User, 'id'> = {
        name,
        email,
        role: userRole,
        avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
        paymentMethods: [],
        transactions: initialTransactions,
        isBlocked: false,
        verificationStatus: 'unverified',
      };

      await setDoc(doc(db, 'users', authUser.uid), newUser);
      
      if (userRole === 'freelancer') {
        await setDoc(doc(db, 'freelancerProfiles', authUser.uid), {
            userId: authUser.uid,
            skills: [],
            bio: '',
            hourlyRate: 0,
            portfolio: [],
        });
      } else if (userRole === 'client') {
        await setDoc(doc(db, 'clientProfiles', authUser.uid), {
            userId: authUser.uid,
            companyName: name,
            projectsPosted: [],
        });
      }
      
      const userForState: User = { id: authUser.uid, ...newUser };
      return { success: true, user: userForState };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
          return { success: false, message: 'email-in-use' };
      }
      if (error.code === 'auth/weak-password') {
          return { success: false, message: 'weak-password' };
      }
      return { success: false, message: 'unknown' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const updateUserProfile = async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, userData);

      if (profileData) {
        const userDoc = await getDoc(userDocRef);
        const userRole = userDoc.data()?.role;
        if (userRole === 'freelancer') {
          await updateDoc(doc(db, 'freelancerProfiles', userId), profileData);
        } else if (userRole === 'client') {
          await updateDoc(doc(db, 'clientProfiles', userId), profileData);
        }
      }
      return true;
    } catch (error) {
      console.error("Error updating profile: ", error);
      return false;
    }
  };

  const submitVerification = async (userId: string, documents: { passportOrIdUrl: string; businessCertificateUrl?: string }): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        verificationStatus: 'pending',
        passportOrIdUrl: documents.passportOrIdUrl,
        businessCertificateUrl: documents.businessCertificateUrl || null,
        verificationRejectionReason: null,
      });
      return true;
    } catch (error) { return false; }
  };

  const approveVerification = async (userId: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', userId), { verificationStatus: 'verified', verificationRejectionReason: null });
      return true;
    } catch (error) { return false; }
  };

  const rejectVerification = async (userId: string, reason: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', userId), { verificationStatus: 'rejected', verificationRejectionReason: reason });
      return true;
    } catch (error) { return false; }
  };

  const addPaymentMethod = async (userId: string, method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
    try {
      const newMethod = { ...method, id: `pm-${Date.now()}` };
      await updateDoc(doc(db, 'users', userId), { paymentMethods: arrayUnion(newMethod) });
      return true;
    } catch (error) { return false; }
  };

  const removePaymentMethod = async (userId: string, methodId: string): Promise<boolean> => {
    if (!user || !user.paymentMethods) return false;
    try {
      const methodToRemove = user.paymentMethods.find(pm => pm.id === methodId);
      if (methodToRemove) {
        await updateDoc(doc(db, 'users', userId), { paymentMethods: arrayRemove(methodToRemove) });
      }
      return true;
    } catch(error) { return false; }
  };

  const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    try {
      const newTransaction = { ...transaction, id: `txn-${Date.now()}`, date: new Date().toISOString() };
      await updateDoc(doc(db, 'users', userId), { transactions: arrayUnion(newTransaction) });
      return true;
    } catch (error) { return false; }
  };
  
  const toggleUserBlockStatus = async (userId: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const currentStatus = userDoc.data()?.isBlocked || false;
      await updateDoc(doc(db, 'users', userId), { isBlocked: !currentStatus });
      return true;
    } catch (error) { return false; }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      // Note: In a real app, you'd also delete the Firebase Auth user and handle cleanup of related data.
      await deleteDoc(doc(db, 'freelancerProfiles', userId)).catch(() => {});
      await deleteDoc(doc(db, 'clientProfiles', userId)).catch(() => {});
      return true;
    } catch(error) { return false; }
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
