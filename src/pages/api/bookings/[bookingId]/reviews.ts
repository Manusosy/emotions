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

  const { bookingId } = req.query;
  
  if (typeof bookingId !== 'string') {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }

  if (req.method === 'POST') {
    try {
      const { mood_mentor_id, rating, comment } = req.body;

      if (!mood_mentor_id || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the booking belongs to the user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', bookingId)
        .eq('user_id', session.user.id)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Cannot review uncompleted booking' });
      }

      // Check if review already exists
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (reviewError) {
        console.error('Error checking existing review:', reviewError);
        return res.status(500).json({ error: 'Failed to check for existing review' });
      }

      if (existingReview) {
        return res.status(400).json({ error: 'Review already exists' });
      }

      // Create the review
      const { data: review, error: createError } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          user_id: session.user.id,
          mood_mentor_id: mood_mentor_id,
          rating,
          comment
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating review:', createError);
        return res.status(500).json({ error: 'Failed to create review' });
      }

      return res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 