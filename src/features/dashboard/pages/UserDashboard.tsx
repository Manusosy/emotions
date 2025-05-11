import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReviewModal } from '@/features/mood-mentors/components/ReviewModal';
import { Booking, bookingService } from '@/services/bookingService';

export function UserDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const bookingsData = await bookingService.getUserBookings();
      setBookings(bookingsData);
    } catch (error) {
      toast.error('Failed to load bookings');
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    loadBookings();
    setIsReviewModalOpen(false);
    setSelectedBooking(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Sessions</h2>
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven't booked any sessions yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle>{booking.ambassador.full_name}</CardTitle>
                    <CardDescription>
                      {format(new Date(booking.session_date), 'PPP')} at{' '}
                      {booking.session_time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {booking.status}
                        </p>
                      </div>
                      {booking.notes && (
                        <div>
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.notes}
                          </p>
                        </div>
                      )}
                      {booking.status === 'completed' && !booking.has_review && (
                        <Button
                          onClick={() => handleReviewClick(booking)}
                          className="w-full"
                        >
                          Leave a Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={handleReviewComplete}
          bookingId={selectedBooking.id}
          ambassadorId={selectedBooking.ambassador.id}
          ambassadorName={selectedBooking.ambassador.full_name}
        />
      )}
    </div>
  );
}
