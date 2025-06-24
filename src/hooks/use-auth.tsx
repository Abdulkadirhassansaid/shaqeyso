
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, FreelancerProfile, ClientProfile, PaymentMethod, Transaction } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer') => Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }>;
  logout: () => void;
  updateUserProfile: (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>) => Promise<boolean>;
  addPaymentMethod: (userId: string, method: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (userId: string, methodId: string) => Promise<boolean>;
  addTransaction: (userId: string, transaction: Omit<Transaction, 'id' | 'date'>) => Promise<boolean>;
  toggleUserBlockStatus: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  submitVerification: (userId: string, documents: { passportOrIdUrl: string; businessCertificateUrl?: string }) => Promise<boolean>;
  approveVerification: (userId: string) => Promise<boolean>;
  rejectVerification: (userId: string, reason: string) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        if (!auth || !db) {
          setIsLoading(false);
          return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (userDocSnap) => {
                    if (userDocSnap.exists()) {
                        const userData = { ...userDocSnap.data(), id: userDocSnap.id } as User;
                        setUser(userData);
                    } else {
                        // This case handles the small delay between auth creation and DB write
                        // during signup. We don't nullify the user here to avoid race conditions.
                    }
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error listening to user document:", error);
                    setIsLoading(false);
                });
                return () => unsubDoc();
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);
    

    const login = React.useCallback(async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }> => {
        if (!auth || !db) return { success: false, message: 'invalid' };
        try {
            const usersQuery = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(usersQuery);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as User;
                if (userData.isBlocked) {
                    return { success: false, message: 'blocked' };
                }
            }

            const creds = await signInWithEmailAndPassword(auth, email, pass);
            const userDocSnap = await getDoc(doc(db, 'users', creds.user.uid));
            return { success: true, user: userDocSnap.data() as User };
        } catch (error: any) {
            return { success: false, message: 'invalid' };
        }
    }, []);

    const signup = React.useCallback(async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }> => {
        if (!auth || !db) return { success: false, message: 'unknown' };
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const authUser = userCredential.user;

            let initialTransactions: Omit<Transaction, 'id' | 'date'>[] = [];
            if (role === 'client') {
                initialTransactions.push({
                    description: 'Initial account funding',
                    amount: 5000,
                    status: 'Completed'
                });
            }

            const newUser: User = {
                id: authUser.uid,
                name,
                email: authUser.email!,
                avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
                role,
                isBlocked: false,
                verificationStatus: 'unverified',
            };
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', authUser.uid), newUser);
            
            initialTransactions.forEach(tx => {
                const txRef = doc(collection(db, `users/${authUser.uid}/transactions`));
                batch.set(txRef, {...tx, date: new Date().toISOString() });
            });

            if (role === 'freelancer') {
                batch.set(doc(db, 'freelancerProfiles', authUser.uid), {
                    skills: [], bio: '', hourlyRate: 0, portfolio: []
                });
            } else {
                 batch.set(doc(db, 'clientProfiles', authUser.uid), {
                    companyName: name, projectsPosted: []
                });
            }
            
            await batch.commit();

            // By setting the user manually here, we avoid race conditions with onAuthStateChanged
            setUser(newUser);
            return { success: true, user: newUser };

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                return { success: false, message: 'email-in-use' };
            }
            if (error.code === 'auth/weak-password') {
                return { success: false, message: 'weak-password' };
            }
            return { success: false, message: 'unknown' };
        }
    }, []);

    const logout = React.useCallback(async () => {
        if (!auth) return;
        await signOut(auth);
        setUser(null);
        router.push('/login');
    }, [router]);

    const updateUserProfile = React.useCallback(async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
        if (!db) return false;
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, userData);

            if (profileData) {
                const userDoc = await getDoc(userRef);
                const userToUpdate = userDoc.data() as User;
                const profileCollection = userToUpdate?.role === 'freelancer' ? 'freelancerProfiles' : 'clientProfiles';
                if (userToUpdate) {
                     await setDoc(doc(db, profileCollection, userId), profileData, { merge: true });
                }
            }
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    }, []);
    
    const submitVerification = React.useCallback(async (userId: string, documents: { passportOrIdUrl: string; businessCertificateUrl?: string }): Promise<boolean> => {
        if (!db) return false;
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                verificationStatus: 'pending',
                ...documents,
                verificationRejectionReason: '', // Clear previous reason
            });
            return true;
        } catch (error) {
            console.error("Error submitting verification:", error);
            return false;
        }
    }, []);

    const approveVerification = React.useCallback(async (userId: string): Promise<boolean> => {
        if (!db) return false;
        try {
            await updateDoc(doc(db, 'users', userId), { verificationStatus: 'verified' });
            return true;
        } catch (error) {
             console.error("Error approving verification:", error);
            return false;
        }
    }, []);

    const rejectVerification = React.useCallback(async (userId: string, reason: string): Promise<boolean> => {
        if (!db) return false;
        try {
            await updateDoc(doc(db, 'users', userId), { verificationStatus: 'rejected', verificationRejectionReason: reason });
            return true;
        } catch (error) {
            console.error("Error rejecting verification:", error);
            return false;
        }
    }, []);

    const addPaymentMethod = React.useCallback(async (userId: string, method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
        if (!db) return false;
        try {
            const newMethod = { ...method, id: `pm-${Date.now()}` };
            await updateDoc(doc(db, 'users', userId), {
                paymentMethods: arrayUnion(newMethod)
            });
            return true;
        } catch (error) {
            console.error("Error adding payment method:", error);
            return false;
        }
    }, []);

    const removePaymentMethod = React.useCallback(async (userId: string, methodId: string): Promise<boolean> => {
       if (!db) return false;
       try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return false;
            const userData = userDoc.data() as User;
            const methodToRemove = userData.paymentMethods?.find(pm => pm.id === methodId);
            if (methodToRemove) {
                 await updateDoc(doc(db, 'users', userId), {
                    paymentMethods: arrayRemove(methodToRemove)
                });
            }
            return true;
        } catch (error) {
            console.error("Error removing payment method:", error);
            return false;
        }
    }, []);

    const addTransaction = React.useCallback(async (userId: string, transaction: Omit<Transaction, 'id' | 'date'>): Promise<boolean> => {
        if (!db) return false;
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                transactions: arrayUnion({
                    ...transaction,
                    id: `txn-${Date.now()}`,
                    date: new Date().toISOString()
                })
            });
            return true;
        } catch (error) {
            console.error("Error adding transaction:", error);
            return false;
        }
    }, []);

    const toggleUserBlockStatus = React.useCallback(async (userId: string): Promise<boolean> => {
        if (!db) return false;
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return false;
            await updateDoc(doc(db, 'users', userId), { isBlocked: !userDoc.data().isBlocked });
            return true;
        } catch (error) {
            console.error("Error toggling block status:", error);
            return false;
        }
    }, []);

    const deleteUser = React.useCallback(async (userId: string): Promise<boolean> => {
        if (!db) return false;
        // NOTE: This does not delete the user from Firebase Auth, which requires admin privileges (e.g. a Cloud Function)
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'users', userId));
            batch.delete(doc(db, 'freelancerProfiles', userId));
            batch.delete(doc(db, 'clientProfiles', userId));
            // In a real app, you would also delete all their subcollections, jobs, proposals etc.
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error deleting user from DB:", error);
            return false;
        }
    }, []);

    const value = React.useMemo(() => ({ user, isLoading, login, logout, signup, updateUserProfile, addPaymentMethod, removePaymentMethod, addTransaction, toggleUserBlockStatus, deleteUser, submitVerification, approveVerification, rejectVerification }), 
    [user, isLoading, login, logout, signup, updateUserProfile, addPaymentMethod, removePaymentMethod, addTransaction, toggleUserBlockStatus, deleteUser, submitVerification, approveVerification, rejectVerification]);


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
