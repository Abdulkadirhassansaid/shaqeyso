
'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  editable?: boolean;
  size?: number;
  className?: string;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  editable = false, 
  size = 16,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleRating = (rate: number) => {
    if (editable && onRatingChange) {
      onRatingChange(rate);
    }
  };

  const handleMouseEnter = (rate: number) => {
    if (editable) {
      setHoverRating(rate);
    }
  };

  const handleMouseLeave = () => {
    if (editable) {
      setHoverRating(0);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={cn(
            "text-muted-foreground transition-colors",
            editable && "cursor-pointer",
            (hoverRating || rating) >= star ? "text-accent fill-accent" : "fill-muted"
          )}
          onClick={() => handleRating(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  );
}
