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

  if (req.method === 'GET') {
    try {
      // Fetch mood mentors from Supabase
      const { data: mentors, error } = await supabase
        .from('mood_mentors')
        .select(`
          id,
          full_name,
          email,
          bio,
          created_at,
          updated_at,
          reviews:mentor_reviews(rating),
          bookings:mentor_bookings(id)
        `);

      if (error) throw error;

      // Transform the data to match the frontend interface
      const transformedMentors = mentors.map(mentor => {
        // Calculate average rating
        const ratings = mentor.reviews?.map(r => r.rating) || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        
        // Calculate satisfaction percentage
        const satisfaction = Math.round((avgRating / 5) * 100);

        return {
          id: mentor.id,
          name: mentor.full_name,
          credentials: 'Mental Health Professional', // This should come from a profile extension table
          specialty: 'Mental Health Support', // This should come from a profile extension table
          rating: avgRating,
          totalRatings: mentor.reviews?.length || 0,
          feedback: mentor.reviews?.length || 0,
          location: 'Remote', // This should come from a profile extension table
          isFree: true, // This should come from a profile extension table
          therapyTypes: ['Cognitive Behavioral Therapy'], // This should come from a profile extension table
          image: '/placeholder-avatar.png', // This should come from a profile extension table
          satisfaction,
        };
      });

      return res.status(200).json(transformedMentors);
    } catch (error) {
      console.error('Error fetching mood mentors:', error);
      return res.status(500).json({ error: 'Failed to fetch mood mentors' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 