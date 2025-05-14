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

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { moodMentorId, bookingId, rating, comment } = req.body;

      // Validate required fields
      if (!moodMentorId || !bookingId || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the booking exists and belongs to the user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .eq('user_id', session.user.id)
        .eq('mood_mentor_id', moodMentorId)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Create the review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: session.user.id,
          mood_mentor_id: moodMentorId,
          booking_id: bookingId,
          rating,
          comment,
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Error creating review:', reviewError);
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