
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
import { useLoading } from './use-loading';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer' | 'admin') => Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }>;
  logout: () => void;
  updateUserProfile: (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>) => Promise<boolean>;
  addPaymentMethod: (userId: string, method: Omit<PaymentMethod, 'id'>) => Promise<boolean>;
  removePaymentMethod: (userId: string, methodId: string) => Promise<boolean>;
  addTransaction: (userId: string, transaction: Omit<Transaction, 'id' | 'date'>) => Promise<boolean>;
  toggleUserBlockStatus: (userId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  submitVerification: (userId: string, documents: { idDocUrl: string, certDocUrl?: string }) => Promise<boolean>;
  approveVerification: (userId: string) => Promise<boolean>;
  rejectVerification: (userId: string, reason: string) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null);
    const [authHasLoaded, setAuthHasLoaded] = React.useState(false);
    const [dbUserLoaded, setDbUserLoaded] = React.useState(false);

    const isLoading = !authHasLoaded || !dbUserLoaded;

    const router = useRouter();
    const { setIsLoading: setPageIsLoading } = useLoading();

    React.useEffect(() => {
      if (!auth || !db) {
        setAuthHasLoaded(true);
        setDbUserLoaded(true);
        return;
      }
      
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setAuthHasLoaded(true);
        if (firebaseUser) {
          setDbUserLoaded(false); // Reset DB loaded status for new user
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubDoc = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
              const userData = { ...userDocSnap.data(), id: userDocSnap.id } as User;
              setUser(userData);
            } else {
              setUser(null);
            }
            setDbUserLoaded(true);
          }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(null);
            setDbUserLoaded(true);
          });
          return () => unsubDoc();
        } else {
          setUser(null);
          setDbUserLoaded(true); // No user, so DB loading is complete
        }
      });
      return () => unsubscribe();
    }, []);
    

     const signup = React.useCallback(async (name: string, email: string, pass: string, role: 'client' | 'freelancer' | 'admin'): Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }> => {
        if (!auth || !db) return { success: false, message: 'unknown' };
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const authUser = userCredential.user;

            let initialTransactions: Transaction[] = [];
            const isAdmin = email.toLowerCase() === 'mahiryare@gmail.com';
            const finalRole = isAdmin ? 'admin' : role;

            if (finalRole === 'client') {
                initialTransactions.push({
                    id: `txn-${Date.now()}`,
                    description: 'Initial account funding',
                    amount: 5000,
                    status: 'Completed',
                    date: new Date().toISOString()
                });
            }

            const newUser: User = {
                id: authUser.uid,
                name,
                email: authUser.email!,
                avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
                role: finalRole,
                isBlocked: false,
                verificationStatus: isAdmin ? 'verified' : 'unverified',
                transactions: initialTransactions.length > 0 ? initialTransactions : undefined,
            };
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', authUser.uid), newUser);

            if (finalRole === 'freelancer') {
                batch.set(doc(db, 'freelancerProfiles', authUser.uid), {
                    skills: [], bio: '', hourlyRate: 0, portfolio: [], services: []
                });
            } else if (finalRole === 'client') {
                 batch.set(doc(db, 'clientProfiles', authUser.uid), {
                    companyName: name, projectsPosted: []
                });
            }
            
            await batch.commit();

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

    const login = React.useCallback(async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }> => {
        if (!auth || !db) return { success: false, message: 'invalid' };

        const isPotentialAdminLogin = email.toLowerCase() === 'mahiryare@gmail.com' && pass === 'Mahir4422';

        if (isPotentialAdminLogin) {
          try {
            const creds = await signInWithEmailAndPassword(auth, email, pass);
            const userDocRef = doc(db, 'users', creds.user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                if (userData.role !== 'admin') {
                    await updateDoc(userDocRef, { role: 'admin', verificationStatus: 'verified' });
                    const updatedUserSnap = await getDoc(userDocRef);
                    return { success: true, user: updatedUserSnap.data() as User };
                }
                return { success: true, user: userData };
            } else {
              const adminUser: User = {
                id: creds.user.uid, name: 'Admin', email, role: 'admin',
                avatarUrl: `https://placehold.co/100x100.png?text=A`, isBlocked: false, verificationStatus: 'verified',
              };
              await setDoc(userDocRef, adminUser);
              return { success: true, user: adminUser };
            }
          } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
              const signupResult = await signup('Admin', email, pass, 'admin');
              return signupResult;
            }
            return { success: false, message: 'invalid' };
          }
        }

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
            if (userDocSnap.exists()) {
                 return { success: true, user: userDocSnap.data() as User };
            }
            return { success: false, message: 'invalid' };
           
        } catch (error) {
            return { success: false, message: 'invalid' };
        }
    }, [signup]);

    const logout = React.useCallback(async () => {
        if (!auth) return;
        setPageIsLoading(true);
        await signOut(auth);
        setUser(null);
        router.push('/login');
    }, [router, setPageIsLoading]);

    const updateUserProfile = React.useCallback(async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
        if (!db) return false;
        try {
            const batch = writeBatch(db);

            if (userData && Object.keys(userData).length > 0) {
                const userRef = doc(db, 'users', userId);
                batch.update(userRef, userData);
            }

            if (profileData && Object.keys(profileData).length > 0) {
                const userDocSnap = await getDoc(doc(db, 'users', userId));
                if (userDocSnap.exists()) {
                    const user = userDocSnap.data() as User;
                    const profileCollection = user.role === 'freelancer' ? 'freelancerProfiles' : 'clientProfiles';
                    const profileRef = doc(db, profileCollection, userId);
                    batch.set(profileRef, profileData, { merge: true });
                }
            }

            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    }, []);
    
    const submitVerification = React.useCallback(async (userId: string, documents: { idDocUrl: string, certDocUrl?: string }): Promise<boolean> => {
        if (!db) return false;
        try {
            const docUpdates: { [key: string]: any } = {
                passportOrIdUrl: documents.idDocUrl,
                verificationStatus: 'pending',
                verificationRejectionReason: '', // Clear any previous rejection reason
            };

            if (documents.certDocUrl) {
                docUpdates.businessCertificateUrl = documents.certDocUrl;
            }

            await updateDoc(doc(db, 'users', userId), docUpdates);
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
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'users', userId));
            batch.delete(doc(db, 'freelancerProfiles', userId));
            batch.delete(doc(db, 'clientProfiles', userId));
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
