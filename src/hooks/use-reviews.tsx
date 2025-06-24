
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Review } from '@/lib/types';

interface ReviewsContextType {
  reviews: Review[];
  addReview: (reviewData: Omit<Review, 'id' | 'date'>) => Promise<boolean>;
  deleteReviewsByJobId: (jobId: string) => Promise<boolean>;
  deleteReviewsForUser: (userId: string) => Promise<boolean>;
}

const ReviewsContext = React.createContext<ReviewsContextType | null>(null);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = React.useState<Review[]>([]);

  React.useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'reviews'), (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({ 
            ...doc.data(), 
            id: doc.id,
            date: doc.data().date?.toDate()?.toISOString() || new Date().toISOString()
        } as Review));
        setReviews(reviewsData);
    }, (error) => {
        console.error("Error fetching reviews:", error);
    });
    return () => unsubscribe();
  }, []);

  const addReview = React.useCallback(async (reviewData: Omit<Review, 'id' | 'date'>): Promise<boolean> => {
    if (!db) return false;
    try {
        await addDoc(collection(db, 'reviews'), {
            ...reviewData,
            date: serverTimestamp(),
        });
        return true;
    } catch(error) {
        console.error("Error adding review:", error);
        return false;
    }
  }, []);

  const deleteReviewsByJobId = React.useCallback(async (jobId: string): Promise<boolean> => {
      if (!db) return false;
      console.warn("Deleting reviews requires a backend function for security, performing client-side for demo.");
      try {
        const q = query(collection(db, "reviews"), where("jobId", "==", jobId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return true;
      } catch(error) {
        console.error("Error deleting reviews by job id", error);
        return false;
      }
  }, []);

  const deleteReviewsForUser = React.useCallback(async (userId: string): Promise<boolean> => {
      if (!db) return false;
      console.warn("Deleting reviews requires a backend function for security, performing client-side for demo.");
      try {
        const q1 = query(collection(db, "reviews"), where("reviewerId", "==", userId));
        const q2 = query(collection(db, "reviews"), where("revieweeId", "==", userId));

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const batch = writeBatch(db);
        snapshot1.docs.forEach(doc => batch.delete(doc.ref));
        snapshot2.docs.forEach(doc => batch.delete(doc.ref));
        
        await batch.commit();
        return true;
      } catch(error) {
        console.error("Error deleting reviews for user", error);
        return false;
      }
  }, []);

  const value = React.useMemo(() => ({ reviews, addReview, deleteReviewsByJobId, deleteReviewsForUser }), [reviews, addReview, deleteReviewsByJobId, deleteReviewsForUser]);

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export const useReviews = () => {
  const context = React.useContext(ReviewsContext);
  if (context === null) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};
