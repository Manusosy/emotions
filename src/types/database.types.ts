export type UserRole = 'patient' | 'mood_mentor' | 'admin';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type AvailabilityStatus = 'available' | 'busy' | 'away' | 'offline';
export type GroupStatus = 'active' | 'inactive' | 'archived';
export type ResourceType = 'article' | 'video' | 'audio' | 'document' | 'exercise';

export interface PatientHealthMetric {
  id: string;
  patient_id: string;
  weight: number;
  blood_pressure: string;
  heart_rate: number;
  mood: string;
  sleep_hours: number;
  recorded_at: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  emergency_contact?: string;
  medical_conditions: string[];
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MoodMentorProfile {
  id: string;
  user_id: string;
  bio?: string;
  specialties: string[];
  languages: string[];
  education?: string;
  experience?: string;
  hourly_rate: number;
  availability_status: AvailabilityStatus;
  verification_status: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone_number: string;
  last_appointment?: string;
  next_appointment?: string;
  status: 'active' | 'inactive';
  total_sessions: number;
  last_session?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  patient_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  gender?: string;
  country: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  avatar_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  mentor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  mentor_id?: string;
  title: string;
  description?: string;
  content_url?: string;
  type: ResourceType;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  patient_id: string;
  mood_score: number;
  mood_description?: string;
  factors: string[];
  notes?: string;
  recorded_at: string;
}

export interface JournalEntry {
  id: string;
  patient_id: string;
  title: string;
  content: string;
  mood_rating: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
}

export interface SessionNote {
  id: string;
  appointment_id: string;
  content: string;
  mood_progress: number;
  action_items: string[];
  is_shared_with_patient: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportGroup {
  id: string;
  mentor_id: string;
  name: string;
  description?: string;
  max_participants?: number;
  meeting_schedule?: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  patient_id: string;
  joined_at: string;
  status: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ResourceAccessLog {
  id: string;
  resource_id: string;
  user_id: string;
  accessed_at: string;
}

export interface MentorReview {
  id: string;
  mentor_id: string;
  patient_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          phone_number: string | null;
          created_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'last_login'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      mood_mentor_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          specialties: string[] | null;
          languages: string[] | null;
          education: string | null;
          experience: string | null;
          hourly_rate: number | null;
          availability_status: AvailabilityStatus;
          verification_status: boolean;
          rating: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mood_mentor_profiles']['Row'], 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews'>;
        Update: Partial<Database['public']['Tables']['mood_mentor_profiles']['Insert']>;
      };
      patient_profiles: {
        Row: {
          id: string;
          user_id: string;
          date_of_birth: string | null;
          gender: string | null;
          emergency_contact: string | null;
          medical_conditions: string[] | null;
          preferences: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['patient_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['patient_profiles']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          mentor_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          meeting_link: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
  };
}
