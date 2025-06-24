
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
  users: User[];
  freelancerProfiles: FreelancerProfile[];
  clientProfiles: ClientProfile[];
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
    const [users, setUsers] = React.useState<User[]>([]);
    const [freelancerProfiles, setFreelancerProfiles] = React.useState<FreelancerProfile[]>([]);
    const [clientProfiles, setClientProfiles] = React.useState<ClientProfile[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        const unsubUsers = onSnapshot(collection(db!, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
            setUsers(usersData);
        });
        const unsubFreelancerProfiles = onSnapshot(collection(db!, 'freelancerProfiles'), (snapshot) => {
            const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as FreelancerProfile));
            setFreelancerProfiles(profilesData);
        });
        const unsubClientProfiles = onSnapshot(collection(db!, 'clientProfiles'), (snapshot) => {
            const profilesData = snapshot.docs.map(doc => ({ ...doc.data(), userId: doc.id } as ClientProfile));
            setClientProfiles(profilesData);
        });

        return () => {
            unsubUsers();
            unsubFreelancerProfiles();
            unsubClientProfiles();
        };
    }, []);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db!, 'users', firebaseUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (userDocSnap) => {
                    if (userDocSnap.exists()) {
                        const userData = { ...userDocSnap.data(), id: userDocSnap.id } as User;
                        setUser(userData);
                    } else {
                        // This can happen briefly during signup or if a user is deleted.
                        // Let other parts of the app handle this state.
                        setUser(null);
                    }
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
    

    const login = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: 'invalid' | 'blocked' }> => {
        try {
            const usersQuery = query(collection(db!, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(usersQuery);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as User;
                if (userData.isBlocked) {
                    return { success: false, message: 'blocked' };
                }
            }

            const creds = await signInWithEmailAndPassword(auth!, email, pass);
            const userDocSnap = await getDoc(doc(db!, 'users', creds.user.uid));
            return { success: true, user: userDocSnap.data() as User };
        } catch (error: any) {
            console.error("Login error:", error.code);
            return { success: false, message: 'invalid' };
        }
    };

    const signup = async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<{ success: boolean; user?: User; message?: 'email-in-use' | 'weak-password' | 'unknown' }> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth!, email, pass);
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
            
            const batch = writeBatch(db!);
            batch.set(doc(db!, 'users', authUser.uid), newUser);
            
            initialTransactions.forEach(tx => {
                const txRef = doc(collection(db!, `users/${authUser.uid}/transactions`));
                batch.set(txRef, {...tx, date: serverTimestamp()});
            });

            if (role === 'freelancer') {
                batch.set(doc(db!, 'freelancerProfiles', authUser.uid), {
                    skills: [], bio: '', hourlyRate: 0, portfolio: []
                });
            } else {
                 batch.set(doc(db!, 'clientProfiles', authUser.uid), {
                    companyName: name, projectsPosted: []
                });
            }
            
            await batch.commit();

            const finalUser = (await getDoc(doc(db!, 'users', authUser.uid))).data() as User;
            return { success: true, user: finalUser };

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                return { success: false, message: 'email-in-use' };
            }
            if (error.code === 'auth/weak-password') {
                return { success: false, message: 'weak-password' };
            }
            console.error("Signup error:", error);
            return { success: false, message: 'unknown' };
        }
    };

    const logout = async () => {
        await signOut(auth!);
        router.push('/login');
    };

    const updateUserProfile = async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
        try {
            const userRef = doc(db!, 'users', userId);
            await updateDoc(userRef, userData);

            if (profileData) {
                const userToUpdate = users.find(u => u.id === userId);
                if (userToUpdate?.role === 'freelancer') {
                    await updateDoc(doc(db!, 'freelancerProfiles', userId), profileData);
                } else if (userToUpdate?.role === 'client') {
                    await updateDoc(doc(db!, 'clientProfiles', userId), profileData);
                }
            }
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    };
    
    const submitVerification = async (userId: string, documents: { passportOrIdUrl: string; businessCertificateUrl?: string }): Promise<boolean> => {
        try {
            const userRef = doc(db!, 'users', userId);
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
    };

    const approveVerification = async (userId: string): Promise<boolean> => {
        try {
            await updateDoc(doc(db!, 'users', userId), { verificationStatus: 'verified' });
            return true;
        } catch (error) {
             console.error("Error approving verification:", error);
            return false;
        }
    };

    const rejectVerification = async (userId: string, reason: string): Promise<boolean> => {
        try {
            await updateDoc(doc(db!, 'users', userId), { verificationStatus: 'rejected', verificationRejectionReason: reason });
            return true;
        } catch (error) {
            console.error("Error rejecting verification:", error);
            return false;
        }
    };

    const addPaymentMethod = async (userId: string, method: Omit<PaymentMethod, 'id'>): Promise<boolean> => {
        try {
            const newMethod = { ...method, id: `pm-${Date.now()}` };
            await updateDoc(doc(db!, 'users', userId), {
                paymentMethods: arrayUnion(newMethod)
            });
            return true;
        } catch (error) {
            console.error("Error adding payment method:", error);
            return false;
        }
    };

    const removePaymentMethod = async (userId: string, methodId: string): Promise<boolean> => {
       try {
            const userDoc = await getDoc(doc(db!, 'users', userId));
            if (!userDoc.exists()) return false;
            const userData = userDoc.data() as User;
            const methodToRemove = userData.paymentMethods?.find(pm => pm.id === methodId);
            if (methodToRemove) {
                 await updateDoc(doc(db!, 'users', userId), {
                    paymentMethods: arrayRemove(methodToRemove)
                });
            }
            return true;
        } catch (error) {
            console.error("Error removing payment method:", error);
            return false;
        }
    };

    const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id' | 'date'>): Promise<boolean> => {
        try {
            const userRef = doc(db!, 'users', userId);
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
    };

    const toggleUserBlockStatus = async (userId: string): Promise<boolean> => {
        try {
            const userDoc = await getDoc(doc(db!, 'users', userId));
            if (!userDoc.exists()) return false;
            await updateDoc(doc(db!, 'users', userId), { isBlocked: !userDoc.data().isBlocked });
            return true;
        } catch (error) {
            console.error("Error toggling block status:", error);
            return false;
        }
    };

    const deleteUser = async (userId: string): Promise<boolean> => {
        // NOTE: This does not delete the user from Firebase Auth, which requires admin privileges (e.g. a Cloud Function)
        try {
            const batch = writeBatch(db!);
            batch.delete(doc(db!, 'users', userId));
            batch.delete(doc(db!, 'freelancerProfiles', userId));
            batch.delete(doc(db!, 'clientProfiles', userId));
            // In a real app, you would also delete all their subcollections, jobs, proposals etc.
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error deleting user from DB:", error);
            return false;
        }
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
