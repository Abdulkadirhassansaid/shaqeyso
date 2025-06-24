
'use client';

import * as React from 'react';
import { useLocalStorageState } from './use-local-storage-state';
import type { Review } from '@/lib/types';
import { mockReviews } from '@/lib/mock-data';

interface ReviewsContextType {
  reviews: Review[];
  addReview: (reviewData: Omit<Review, 'id' | 'date'>) => Promise<boolean>;
  deleteReviewsByJobId: (jobId: string) => Promise<boolean>;
  deleteReviewsForUser: (userId: string) => Promise<boolean>;
}

const ReviewsContext = React.createContext<ReviewsContextType | null>(null);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useLocalStorageState<Review[]>('all-reviews', mockReviews);

  const addReview = async (reviewData: Omit<Review, 'id' | 'date'>): Promise<boolean> => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      ...reviewData,
      date: new Date().toISOString(),
    };
    setReviews(prev => [...prev, newReview]);
    return true;
  };

  const deleteReviewsByJobId = async (jobId: string): Promise<boolean> => {
      setReviews(prev => prev.filter(r => r.jobId !== jobId));
      return true;
  }

  const deleteReviewsForUser = async (userId: string): Promise<boolean> => {
      setReviews(prev => prev.filter(r => r.revieweeId !== userId && r.reviewerId !== userId));
      return true;
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
