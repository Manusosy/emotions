import { api } from '@/lib/api';

export interface MoodMentor {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  rating: number;
  totalRatings: number;
  feedback: number;
  location: string;
  isFree: boolean;
  therapyTypes: string[];
  image: string;
  satisfaction: number;
}

export interface DashboardStats {
  patientsCount: number;
  appointmentsCount: number;
  groupsCount: number;
  ratingPercentage: number;
  reviewsCount: number;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  phone_number: string;
  last_session: string;
  total_sessions: number;
  status: string;
  last_appointment: string;
  next_appointment: string;
}

export const moodMentorService = {
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const response = await api.get(`/api/mood-mentors/${userId}/stats`);
    return response.json();
  },

  async getClients(userId: string): Promise<Client[]> {
    const response = await api.get(`/api/mood-mentors/${userId}/clients`);
    return response.json();
  },

  async getMoodMentors(): Promise<MoodMentor[]> {
    const response = await api.get('/api/mood-mentors');
    return response.json();
  },

  async submitReview(data: {
    userId: string;
    moodMentorId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }): Promise<void> {
    await api.post('/api/mood-mentors/reviews', data);
  },

  async getReviews(moodMentorId: string): Promise<any[]> {
    const response = await api.get(`/api/mood-mentors/${moodMentorId}/reviews`);
    return response.json();
  },

  async createBooking(data: {
    userId: string;
    moodMentorId: string;
    sessionDate: string;
    sessionTime: string;
    notes: string;
  }): Promise<void> {
    await api.post('/api/mood-mentors/bookings', data);
  }
}; 