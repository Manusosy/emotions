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
      const { moodMentorId, sessionDate, sessionTime, notes } = req.body;

      // Validate required fields
      if (!moodMentorId || !sessionDate || !sessionTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the mood mentor exists
      const { data: moodMentor, error: mentorError } = await supabase
        .from('mood_mentors')
        .select('id')
        .eq('id', moodMentorId)
        .single();

      if (mentorError || !moodMentor) {
        return res.status(404).json({ error: 'Mood Mentor not found' });
      }

      // Check if the time slot is available
      const { data: existingBooking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('mood_mentor_id', moodMentorId)
        .eq('session_date', new Date(sessionDate).toISOString().split('T')[0])
        .eq('session_time', sessionTime)
        .in('status', ['pending', 'confirmed'])
        .maybeSingle();

      if (bookingError) {
        console.error('Error checking existing bookings:', bookingError);
        return res.status(500).json({ error: 'Failed to check time slot availability' });
      }
      
      if (existingBooking) {
        return res.status(409).json({ error: 'Time slot is already booked' });
      }

      // Create the booking
      const { data: booking, error: createError } = await supabase
        .from('bookings')
        .insert({
          user_id: session.user.id,
          mood_mentor_id: moodMentorId,
          session_date: new Date(sessionDate).toISOString().split('T')[0],
          session_time: sessionTime,
          notes: notes || '',
          status: 'pending',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating booking:', createError);
        return res.status(500).json({ error: 'Failed to create booking' });
      }

      return res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 