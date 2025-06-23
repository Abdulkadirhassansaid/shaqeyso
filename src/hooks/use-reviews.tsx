
'use client';

import * as React from 'react';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { mockReviews as initialReviews } from '@/lib/mock-data';
import type { Review } from '@/lib/types';

interface ReviewsContextType {
  reviews: Review[];
  addReview: (reviewData: Omit<Review, 'id' | 'date'>) => Promise<boolean>;
}

const ReviewsContext = React.createContext<ReviewsContextType | null>(null);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useLocalStorageState('shaqo-reviews', initialReviews);

  const addReview = async (reviewData: Omit<Review, 'id' | 'date'>): Promise<boolean> => {
    const newReview: Review = {
      ...reviewData,
      id: `review-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setReviews(prevReviews => [newReview, ...prevReviews]);
    return true;
  };

  const value = { reviews, addReview };

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export const useReviews = () => {
  const context = React.useContext(ReviewsContext);
  if (context === null) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};
