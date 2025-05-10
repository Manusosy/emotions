import { useState, useEffect } from "react";
import { Star, MapPin, Clock, Globe2, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import BookingButton from "@/features/booking/components/BookingButton";
import { moodMentorService } from "@/lib/moodMentorService";
import { errorLog, devLog } from "@/utils/environment";

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

// Sample mock data to use as fallback when API calls fail
const mockMentors: MoodMentor[] = [
  {
    id: "mock-1",
    full_name: "Dr. Sarah Johnson",
    avatar_url: "/lovable-uploads/7d02b0da-dd91-4635-8bc4-6df39dffd0f1.png",
    specialties: ["Depression", "Anxiety", "Relationships"],
    location: "New York, US",
    duration: "45 Min",
    rating: 4.9,
    available: true,
    languages: ["English", "Spanish"],
    education: "PhD Psychology, Harvard",
    experience: "10+ years"
  },
  {
    id: "mock-2",
    full_name: "Dr. Michael Chen",
    avatar_url: "/lovable-uploads/a299cbd8-711d-4138-b99d-eec11582bf18.png",
    specialties: ["Stress Management", "Trauma", "Grief"],
    location: "London, UK",
    duration: "60 Min",
    rating: 4.8,
    available: true,
    languages: ["English", "Mandarin"],
    education: "MD Psychiatry, Oxford",
    experience: "8 years"
  },
  {
    id: "mock-3",
    full_name: "Dr. Olivia Rodriguez",
    avatar_url: "/lovable-uploads/557ff7f5-9815-4228-b935-0fb6a858cc65.png",
    specialties: ["Family Therapy", "ADHD", "Addiction"],
    location: "Toronto, CA",
    duration: "30 Min",
    rating: 4.7,
    available: false,
    languages: ["English", "French"],
    education: "PhD Clinical Psychology, Toronto",
    experience: "12 years"
  }
];

export default function HighlightedDoctors() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<MoodMentor[]>(mockMentors);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        // Check if the service has the required method using type casting
        const extendedService = moodMentorService as unknown as ExtendedMoodMentorService;
        if (extendedService && typeof extendedService.getHighlightedMentors === 'function') {
          const result = await extendedService.getHighlightedMentors(3);
          if (result.success && result.data) {
            setMentors(result.data);
          }
        } else {
          devLog("getHighlightedMentors method not available, using mock data");
        }
      } catch (error) {
        errorLog("Error fetching highlighted mentors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const displayedMentors = mentors.length > 0 ? mentors : mockMentors;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayedMentors.map((mentor) => (
        <Card key={mentor.id} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4">
            <img
              src={mentor.avatar_url}
              alt={mentor.full_name}
              className="w-20 h-20 rounded-full object-cover"
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
      ))}
    </div>
  );
}
