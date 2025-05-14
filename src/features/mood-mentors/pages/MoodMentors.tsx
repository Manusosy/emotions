import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MapPin, ThumbsUp, MessageSquare, DollarSign, Info, Search, Filter, Star, Calendar, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import BookingButton from "@/features/booking/components/BookingButton"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { supabase } from "@/integrations/supabase/client"
import { devLog, errorLog } from "@/utils/environment"

// Define the specialties used in the application
export const MENTAL_HEALTH_SPECIALTIES = [
  { id: "anxiety", label: "Anxiety" },
  { id: "depression", label: "Depression" },
  { id: "stress", label: "Stress Management" },
  { id: "trauma", label: "Trauma" },
  { id: "ptsd", label: "PTSD" },
  { id: "grief", label: "Grief" },
  { id: "addiction", label: "Addiction" },
  { id: "self-esteem", label: "Self-Esteem" },
  { id: "general", label: "General Mental Health" }
];

interface MoodMentor {
  id: string;
  full_name: string;
  specialty: string;
  credentials: string;
  image: string;
  avatar_url?: string;
  location: string;
  satisfaction: number;
  rating?: number;
  therapyTypes: string[];
  specialties?: string[];
  isFree: boolean;
  gender: string;
  languages?: string[];
  experience?: string;
}

interface MentorFilters {
  free: boolean;
  gender: string;
  specialties: Record<string, boolean>;
}

// MentorCardSkeleton component for loading state
const MentorCardSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>

    <div className="space-y-4">
      <div className="flex items-center">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex items-center">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>
  </Card>
);

export default function MoodMentors() {
  const [mentors, setMentors] = useState<MoodMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Initialize filters with all specialties set to false
  const [filters, setFilters] = useState<MentorFilters>({
    free: false,
    gender: "all",
    specialties: MENTAL_HEALTH_SPECIALTIES.reduce((acc, specialty) => {
      acc[specialty.id] = false;
      return acc;
    }, {} as Record<string, boolean>)
  });

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      
      // Fetch mentors from Supabase
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
            gender,
            location,
            is_active
          )
        `)
        .eq('is_public', true)
        .eq('verification_status', true);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transform Supabase data to match MoodMentor interface
        const formattedMentors: MoodMentor[] = data.map(mentor => {
          // Type assertion for nested users object
          const userData = mentor.users as any;
          
          return {
            id: mentor.user_id,
            full_name: userData.full_name,
            specialty: (mentor.specialties && mentor.specialties[0]) || "Mental Health Support",
            credentials: mentor.education || "Licensed Mental Health Professional",
            image: userData.avatar_url || `/lovable-uploads/default-avatar-${Math.floor(Math.random() * 5) + 1}.png`,
            avatar_url: userData.avatar_url,
            location: userData.location || "Remote",
            satisfaction: mentor.rating ? Math.round(mentor.rating * 20) : 95, // Convert rating to percentage
            rating: mentor.rating || 4.7,
            therapyTypes: mentor.specialties || ["General Support"],
            specialties: mentor.specialties || ["Mental Health"],
            isFree: mentor.hourly_rate === 0 || false,
            gender: userData.gender || "Unspecified",
            languages: mentor.languages || ["English"],
            experience: mentor.experience || "Experienced Professional"
          };
        });
        
        setMentors(formattedMentors);
        devLog("Fetched mentors:", formattedMentors);
      } else {
        // If no data from Supabase, try fallback service
        try {
          // @ts-ignore - Ignore window.moodMentorService type error
          const moodMentorService = window.moodMentorService;
          const serviceData = await new Promise<MoodMentor[]>((resolve) => {
            if (typeof moodMentorService !== 'undefined' && typeof moodMentorService.getMoodMentors === 'function') {
              resolve(moodMentorService.getMoodMentors());
            } else {
              resolve([]);
            }
          });
          
          if (serviceData && serviceData.length > 0) {
            setMentors(serviceData);
          }
        } catch (serviceError) {
          errorLog("Error fetching from fallback service:", serviceError);
        }
      }
    } catch (error) {
      errorLog("Error fetching mood mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    // Apply search filter
    const matchesSearch = 
      mentor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.specialties && mentor.specialties.some(spec => 
        spec.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    // Apply checkbox filters
    const matchesFree = !filters.free || mentor.isFree;
    
    // Apply gender filter
    const matchesGender = filters.gender === "all" || 
      mentor.gender?.toLowerCase() === filters.gender.toLowerCase();
    
    // Apply specialty filters - only filter if at least one specialty is selected
    const anySpecialtySelected = Object.values(filters.specialties).some(selected => selected);
    
    let matchesSpecialties = true;
    if (anySpecialtySelected) {
      matchesSpecialties = false;
      // Check if mentor has any of the selected specialties
      const therapyTypes = mentor.therapyTypes || mentor.specialties || [];
      
      // For each specialty that's checked in the filters
      for (const [specialtyId, isSelected] of Object.entries(filters.specialties)) {
        if (isSelected) {
          // Find the specialty label
          const specialty = MENTAL_HEALTH_SPECIALTIES.find(s => s.id === specialtyId);
          if (specialty) {
            // Check if the mentor has this specialty
            const hasSpecialty = therapyTypes.some(type => 
              type.toLowerCase().includes(specialty.id) || 
              type.toLowerCase().includes(specialty.label.toLowerCase())
            );
            
            if (hasSpecialty) {
              matchesSpecialties = true;
              break; // Only need one match
            }
          }
        }
      }
    }

    return matchesSearch && matchesFree && matchesGender && matchesSpecialties;
  });

  // Reset all filters to default values
  const resetFilters = () => {
    setFilters({
      free: false,
      gender: "all",
      specialties: MENTAL_HEALTH_SPECIALTIES.reduce((acc, specialty) => {
        acc[specialty.id] = false;
        return acc;
      }, {} as Record<string, boolean>)
    });
  };

  // Toggle a specialty filter on/off
  const toggleSpecialtyFilter = (specialtyId: string) => {
    setFilters(prev => ({
      ...prev,
      specialties: {
        ...prev.specialties,
        [specialtyId]: !prev.specialties[specialtyId]
      }
    }));
  };

  // Generate skeletons array for loading state
  const skeletons = Array(6).fill(0).map((_, index) => (
    <MentorCardSkeleton key={`skeleton-${index}`} />
  ));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0078FF] via-[#20c0f3] to-[#00D2FF] text-white pt-20 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-white"></div>
          <div className="absolute left-1/3 top-1/3 w-64 h-64 rounded-full bg-white"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Mood Mentors</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-blue-50 mb-8">
              Connect with experienced mental health professionals who are dedicated to supporting your emotional wellbeing journey.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Input 
                type="text"
                placeholder="Search by name or specialty..."
                className="pl-10 pr-14 py-3 w-full rounded-full border-0 text-gray-800 shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Button 
                variant="outline" 
                size="icon" 
                className="absolute right-2 top-2 rounded-full bg-white border-0 text-gray-500 hover:text-[#20c0f3] hover:bg-blue-50"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-50" style={{ 
          clipPath: "ellipse(75% 100% at 50% 100%)" 
        }}></div>
      </div>

      {/* Main Content Section */}
      <div className="py-8 container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="p-6 h-fit lg:col-span-1 shadow-md border-0">
            <h2 className="text-xl font-bold mb-6 text-[#001A41]">Find Your Mentor</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3 text-gray-700">Session Type</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free"
                    checked={filters.free}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, free: checked as boolean }))
                    }
                    className="data-[state=checked]:bg-[#20c0f3] data-[state=checked]:border-[#20c0f3]"
                  />
                  <label htmlFor="free" className="text-sm font-medium leading-none">
                    Free Sessions Available
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3 text-gray-700">Gender</h3>
                <RadioGroup 
                  value={filters.gender}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="gender-all" className="text-[#20c0f3] border-gray-300" />
                    <label htmlFor="gender-all" className="text-sm font-medium leading-none">
                      All
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="gender-male" className="text-[#20c0f3] border-gray-300" />
                    <label htmlFor="gender-male" className="text-sm font-medium leading-none">
                      Male
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="gender-female" className="text-[#20c0f3] border-gray-300" />
                    <label htmlFor="gender-female" className="text-sm font-medium leading-none">
                      Female
                    </label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <h3 className="font-medium mb-3 text-gray-700">Specialties</h3>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                  {MENTAL_HEALTH_SPECIALTIES.map((specialty) => (
                    <div key={specialty.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${specialty.id}`}
                        checked={filters.specialties[specialty.id]}
                        onCheckedChange={() => toggleSpecialtyFilter(specialty.id)}
                        className="data-[state=checked]:bg-[#20c0f3] data-[state=checked]:border-[#20c0f3]"
                      />
                      <label htmlFor={`specialty-${specialty.id}`} className="text-sm font-medium leading-none">
                        {specialty.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full text-[#20c0f3] border-[#20c0f3] hover:bg-[#20c0f3] hover:text-white"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#001A41]">
                {loading ? "Loading mentors..." : `${filteredMentors.length} Mentors Available`}
              </h2>
              
              <div className="text-sm text-gray-500">
                {!loading && filteredMentors.length > 0 && 
                  `Showing ${filteredMentors.length} of ${mentors.length} mentors`
                }
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skeletons}
              </div>
            ) : filteredMentors.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-md">
                <div className="text-gray-500 mb-4">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No mood mentors found matching your criteria</p>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button 
                  variant="outline" 
                  className="mx-auto text-[#20c0f3] border-[#20c0f3] hover:bg-[#20c0f3] hover:text-white"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </Card>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredMentors.map((mentor) => (
                  <motion.div
                    key={mentor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-6 border-0 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                            <img
                              src={mentor.image || mentor.avatar_url || "/lovable-uploads/default-avatar-1.png"}
                              alt={mentor.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/lovable-uploads/default-avatar-1.png";
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{mentor.full_name}</h3>
                            <p className="text-sm text-gray-500">{mentor.credentials}</p>
                          </div>
                        </div>
                        {mentor.isFree && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Free Sessions
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 text-[#20c0f3]" />
                          {mentor.location}
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="h-4 w-4 mr-2 text-amber-400" />
                          <span>{mentor.rating || 4.7}</span>
                          <span className="mx-1">•</span>
                          <span>{mentor.satisfaction}% Satisfaction</span>
                        </div>
                        
                        {mentor.languages && mentor.languages.length > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Globe className="h-4 w-4 mr-2 text-[#20c0f3]" />
                            {mentor.languages.join(", ")}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {(mentor.therapyTypes || mentor.specialties || []).slice(0, 3).map((type, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {type}
                            </Badge>
                          ))}
                          {(mentor.therapyTypes || mentor.specialties || []).length > 3 && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              +{(mentor.therapyTypes || mentor.specialties || []).length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <Link to={`/mood-mentors/${mentor.id}`}>
                            <Button variant="outline" className="mr-2 border-[#20c0f3] text-[#20c0f3] hover:bg-[#20c0f3] hover:text-white">
                              <Info className="h-4 w-4 mr-2" />
                              View Profile
                            </Button>
                          </Link>
                          <BookingButton 
                            mentorId={mentor.id} 
                            mentorName={mentor.full_name}
                            className="bg-[#00D2FF] hover:bg-[#00bde6] text-white"
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 