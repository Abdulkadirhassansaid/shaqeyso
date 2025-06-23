
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
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
    const q = query(collection(db, "reviews"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData: Review[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      setReviews(reviewsData);
    });
    return () => unsubscribe();
  }, []);

  const addReview = async (reviewData: Omit<Review, 'id' | 'date'>): Promise<boolean> => {
    try {
      const newReview = {
        ...reviewData,
        date: new Date().toISOString(),
      };
      await addDoc(collection(db, 'reviews'), newReview);
      return true;
    } catch(e) { return false; }
  };

  const deleteReviewsByJobId = async (jobId: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'reviews'), where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch(e) { return false; }
  }

  const deleteReviewsForUser = async (userId: string): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      
      const q1 = query(collection(db, 'reviews'), where('reviewerId', '==', userId));
      const snap1 = await getDocs(q1);
      snap1.forEach(doc => batch.delete(doc.ref));
      
      const q2 = query(collection(db, 'reviews'), where('revieweeId', '==', userId));
      const snap2 = await getDocs(q2);
      snap2.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      return true;
    } catch(e) { return false; }
  }

  const value = { reviews, addReview, deleteReviewsByJobId, deleteReviewsForUser };

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export const useReviews = () => {
  const context = React.useContext(ReviewsContext);
  if (context === null) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};
