import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

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

  // Verify the mentor is requesting their own clients
  if (session.user.id !== mentorId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      // First get all bookings for this mentor
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          session_time,
          status,
          user_id,
          users:user_id (
            id,
            name,
            email,
            profile_image
          )
        `)
        .eq('mood_mentor_id', mentorId)
        .order('session_date', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return res.status(500).json({ error: 'Failed to fetch clients' });
      }

      // Group bookings by user and transform into client list
      const clientMap = new Map();
      
      for (const booking of bookings) {
        const user = booking.users;
        if (!clientMap.has(user.id)) {
          // Get all bookings for this user with this mentor
          const { data: userBookings, error: userBookingsError } = await supabase
            .from('bookings')
            .select('id, session_date, status')
            .eq('mood_mentor_id', mentorId)
            .eq('user_id', user.id)
            .order('session_date', { ascending: false });
            
          if (userBookingsError) {
            console.error('Error fetching user bookings:', userBookingsError);
            continue;
          }

          const lastSession = userBookings[0]?.session_date;
          const nextSession = userBookings.find(b => 
            new Date(b.session_date) > new Date() && b.status !== 'cancelled'
          )?.session_date;

          clientMap.set(user.id, {
            id: user.id,
            full_name: user.name,
            email: user.email,
            avatar_url: user.profile_image || '', // This may need adjustment based on your schema
            phone_number: '', // This should come from a profile extension
            last_session: lastSession ? format(new Date(lastSession), 'yyyy-MM-dd') : null,
            total_sessions: userBookings.length,
            status: userBookings.some(b => 
              new Date(b.session_date) > new Date() && b.status === 'confirmed'
            ) ? 'active' : 'inactive',
            last_appointment: lastSession ? format(new Date(lastSession), 'MMM dd, yyyy') : null,
            next_appointment: nextSession ? format(new Date(nextSession), 'MMM dd, yyyy') : null,
          });
        }
      }

      return res.status(200).json(Array.from(clientMap.values()));
    } catch (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 