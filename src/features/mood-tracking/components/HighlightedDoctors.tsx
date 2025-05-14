import { useState, useEffect } from "react";
import { Star, MapPin, Clock, Globe2, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import BookingButton from "@/features/booking/components/BookingButton";
import { moodMentorService } from "@/lib/moodMentorService";
import { errorLog, devLog } from "@/utils/environment";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Add a type definition for the expected service response
interface MentorServiceResponse {
  success: boolean;
  data?: MoodMentor[];
  error?: string;
}

// Extend the moodMentorService with the method we're expecting
interface ExtendedMoodMentorService {
  getHighlightedMentors?: (limit: number) => Promise<MentorServiceResponse>;
}

interface MoodMentor {
  id: string;
  full_name: string;
  avatar_url: string;
  specialties: string[];
  location: string;
  duration: string;
  rating: number;
  available: boolean;
  languages: string[];
  education: string;
  experience: string;
}

// MentorCardSkeleton component for loading state
const MentorCardSkeleton = () => (
  <Card className="p-6 bg-white rounded-xl shadow-sm">
    <div className="flex items-start space-x-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center mt-1">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>

    <div className="mt-4 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>

    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>

    <div className="mt-6 space-y-2">
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  </Card>
);

export default function HighlightedDoctors() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<MoodMentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        
        // First try to use the service if available
        const extendedService = moodMentorService as unknown as ExtendedMoodMentorService;
        if (extendedService && typeof extendedService.getHighlightedMentors === 'function') {
          const result = await extendedService.getHighlightedMentors(3);
          if (result.success && result.data && result.data.length > 0) {
            setMentors(result.data);
            return;
          }
        }
        
        // Fallback to direct Supabase query
        const { data, error } = await supabase
          .from('mood_mentor_profiles')
          .select(`
            id,
            user_id,
            bio,
            specialties,
            languages,
            education,
            experience,
            hourly_rate,
            availability_status,
            verification_status,
            rating,
            total_reviews,
            users (
              id,
              full_name,
              avatar_url,
              is_active
            )
          `)
          .eq('is_public', true)
          .eq('verification_status', true)
          .order('rating', { ascending: false })
          .limit(3);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Transform data to match MoodMentor interface
          const formattedMentors: MoodMentor[] = data.map(mentor => ({
            id: mentor.user_id,
            full_name: mentor.users.full_name,
            avatar_url: mentor.users.avatar_url || `/lovable-uploads/default-avatar-${Math.floor(Math.random() * 5) + 1}.png`,
            specialties: mentor.specialties || [],
            location: "Remote", // Default if not available
            duration: "45 Min", // Default if not available
            rating: mentor.rating || 4.5,
            available: mentor.availability_status === 'available',
            languages: mentor.languages || ["English"],
            education: mentor.education || "Certified Mental Health Professional",
            experience: mentor.experience || "Professional Experience"
          }));
          
          setMentors(formattedMentors);
        }
      } catch (error) {
        errorLog("Error fetching highlighted mentors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Highlighted Mood Mentors</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Expert mental health professionals ready to guide you on your emotional wellbeing journey
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Show skeleton loaders while loading
            Array(3).fill(0).map((_, index) => (
              <MentorCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : mentors.length > 0 ? (
            // Show actual mentor data
            mentors.map((mentor) => (
              <Card key={mentor.id} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <img
                    src={mentor.avatar_url}
                    alt={mentor.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/lovable-uploads/default-avatar-1.png";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{mentor.full_name}</h3>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{mentor.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{mentor.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{mentor.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Globe2 className="w-4 h-4 mr-2" />
                    <span className="text-sm">{mentor.languages.join(", ")}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span className="text-sm">{mentor.education}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {mentor.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/mood-mentors/${mentor.id}`)}
                    className="w-full px-4 py-2 text-sm font-medium text-[#00D2FF] border border-[#00D2FF] rounded-md hover:bg-[#00D2FF] hover:text-white transition-colors"
                  >
                    View Profile
                  </button>
                  <BookingButton
                    mentorId={mentor.id}
                    mentorName={mentor.full_name}
                    buttonText="Book Appointment"
                    className="w-full"
                    variant="default"
                  />
                </div>
              </Card>
            ))
          ) : (
            // Show empty state with skeletons when no mentors are available yet
            Array(3).fill(0).map((_, index) => (
              <Card key={`empty-${index}`} className="p-6 bg-white rounded-xl shadow-sm">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <p className="font-medium">
                      Waiting for mood mentors to join...
                    </p>
                    <p className="text-sm mt-2">
                      Our mentors will appear here once they complete their profiles
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
