
'use client';

import * as React from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Review } from '@/lib/types';

interface ReviewsContextType {
  reviews: Review[];
  addReview: (reviewData: Omit<Review, 'id' | 'date'>) => Promise<boolean>;
  deleteReviewsByJobId: (jobId: string) => Promise<boolean>; // Requires backend function
  deleteReviewsForUser: (userId: string) => Promise<boolean>; // Requires backend function
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
      console.warn("Deleting reviews requires a backend function for security.");
      return true;
  }, []);

  const deleteReviewsForUser = React.useCallback(async (userId: string): Promise<boolean> => {
      console.warn("Deleting reviews requires a backend function for security.");
      return true;
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
