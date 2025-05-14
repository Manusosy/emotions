import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get bookings with mood mentor details
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          session_date, 
          session_time, 
          status, 
          notes,
          mood_mentors:mood_mentor_id (
            id,
            full_name
          )
        `)
        .eq('user_id', session.user.id)
        .order('session_date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

      // Get reviews to check if booking has a review
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, booking_id')
        .eq('user_id', session.user.id);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }

      // Create a set of booking IDs that have reviews
      const bookingsWithReviews = new Set(reviews?.map(review => review.booking_id) || []);

      // Transform the data to match the frontend interface
      const transformedBookings = bookings.map((booking) => ({
        id: booking.id,
        session_date: booking.session_date,
        session_time: booking.session_time,
        status: booking.status,
        notes: booking.notes || '',
        mood_mentor: {
          id: booking.mood_mentors?.id,
          full_name: booking.mood_mentors?.full_name,
        },
        has_review: bookingsWithReviews.has(booking.id),
      }));

      return res.status(200).json(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 