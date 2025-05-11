import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { moodMentorService } from '@/services/moodMentorService';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  users: {
    full_name: string;
    avatar_url: string;
  } | null;
}

interface ReviewListProps {
  ambassadorId: string;
}

export function ReviewList({ ambassadorId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [ambassadorId]);

  const loadReviews = async () => {
    try {
      const data = await moodMentorService.getReviews(ambassadorId);
      
      // Transform the data to match our interface
      const safeReviews = data.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        users: review.users && typeof review.users === 'object' ? 
          {
            full_name: review.users?.full_name || 'Anonymous User',
            avatar_url: review.users?.avatar_url || '/default-avatar.png'
          } : null
      }));
      
      setReviews(safeReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No reviews yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={review.users?.avatar_url || '/default-avatar.png'}
                  alt={`${review.users?.full_name || 'Anonymous User'}'s avatar`}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <CardTitle className="text-sm font-medium">
                    {review.users?.full_name || 'Anonymous User'}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(review.created_at), 'PPP')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
