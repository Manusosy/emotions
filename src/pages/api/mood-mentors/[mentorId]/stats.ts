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
  const { mentorId } = req.query;

  if (!session?.user?.id || typeof mentorId !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify the mentor is requesting their own stats
  if (session.user.id !== mentorId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      // Get all bookings for this mentor
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, user_id, session_date, status')
        .eq('mood_mentor_id', mentorId);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

      // Get all reviews for this mentor
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('mood_mentor_id', mentorId);
        
      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return res.status(500).json({ error: 'Failed to fetch reviews' });
      }

      // Get all support groups for this mentor
      const { data: groups, error: groupsError } = await supabase
        .from('support_groups')
        .select('id')
        .eq('mentor_id', mentorId);
        
      if (groupsError) {
        console.error('Error fetching support groups:', groupsError);
        return res.status(500).json({ error: 'Failed to fetch support groups' });
      }

      // Calculate stats
      const uniquePatients = new Set(bookings.map(b => b.user_id)).size;
      const upcomingAppointments = bookings.filter(b => 
        new Date(b.session_date) > new Date() && 
        b.status === 'confirmed'
      ).length;
      const ratings = reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      const ratingPercentage = Math.round((avgRating / 5) * 100);

      return res.status(200).json({
        patientsCount: uniquePatients,
        appointmentsCount: upcomingAppointments,
        groupsCount: groups.length,
        ratingPercentage,
        reviewsCount: reviews.length,
      });
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
      return res.status(500).json({ error: 'Failed to fetch mentor stats' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 