import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Edit,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  Award,
  BookOpen,
  Monitor,
  Languages,
  Star,
  MapPin,
  RefreshCw
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface AmbassadorProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  bio: string;
  speciality: string; 
  languages: string[];
  education: any[];
  experience: any[];
  awards?: any[];
  availability_status: string;
  avatar_url: string;
  ambassador_id: string;
  created_at: string;
  updated_at: string;
  specialty?: string;
  specialties?: string[];
  credentials?: string;
  location?: string;
  therapyTypes?: any[];
  consultation_fee?: number;
  isFree?: boolean;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeClients: 0,
    totalHours: 0,
    averageRating: 0,
  });

  const calculateProfileCompletion = (profileData: AmbassadorProfile) => {
    let completedSections = 0;
    let totalSections = 7; // Total number of important profile sections
    
    // Personal info section
    if (profileData.full_name && profileData.email && profileData.phone_number) completedSections++;
    
    // Bio & Specialties
    if (profileData.bio && 
       ((profileData.specialties && profileData.specialties.length > 0) || 
        profileData.speciality || 
        profileData.specialty)) 
      completedSections++;
    
    // Education & Experience
    const hasValidEducation = Array.isArray(profileData.education) && profileData.education.some(
      edu => edu.university && edu.degree && edu.period
    );
    
    const hasValidExperience = Array.isArray(profileData.experience) && profileData.experience.some(
      exp => exp.company && exp.position && exp.period
    );
    
    if (hasValidEducation && hasValidExperience) completedSections++;
    
    // Therapy & Services
    if ((profileData.therapyTypes && profileData.therapyTypes.length > 0) && 
        (profileData.specialty || profileData.speciality)) completedSections++;
    
    // Availability & Pricing
    if (profileData.availability_status) completedSections++;
    
    // Media
    if (profileData.avatar_url) completedSections++;
    
    // Location and other info
    if (profileData.location && 
        (Array.isArray(profileData.languages) && profileData.languages.length > 0)) 
      completedSections++;
    
    return Math.round((completedSections / totalSections) * 100);
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        return;
      }

      // Fetch from both tables to ensure we get the most complete data
      const [ambassadorResult, profileResult] = await Promise.all([
        supabase
          .from("ambassador_profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
      ]);
      
      let finalProfile: AmbassadorProfile | null = null;
      
      // First try ambassador_profiles table
      if (!ambassadorResult.error && ambassadorResult.data) {
        // Handle formatting/processing of data
        finalProfile = {
          ...ambassadorResult.data,
          languages: ambassadorResult.data.languages ? 
            (typeof ambassadorResult.data.languages === 'string' ? 
              ambassadorResult.data.languages.split(',') : 
              ambassadorResult.data.languages) : [],
          speciality: ambassadorResult.data.speciality || '',
          specialty: ambassadorResult.data.specialty || '',
          specialties: ambassadorResult.data.specialties || [],
          education: Array.isArray(ambassadorResult.data.education) ? 
            ambassadorResult.data.education : [],
          experience: Array.isArray(ambassadorResult.data.experience) ? 
            ambassadorResult.data.experience : [],
        };
      }
      
      // Then check if profiles table has additional data
      if (!profileResult.error && profileResult.data) {
        if (!finalProfile) {
          finalProfile = {
            ...profileResult.data,
            id: user.id,
            ambassador_id: user.id,
            languages: profileResult.data.languages ? 
              (typeof profileResult.data.languages === 'string' ? 
                profileResult.data.languages.split(',') : 
                profileResult.data.languages) : [],
            speciality: profileResult.data.speciality || profileResult.data.specialty || '',
            education: Array.isArray(profileResult.data.education) ? 
              profileResult.data.education : [],
            experience: Array.isArray(profileResult.data.experience) ? 
              profileResult.data.experience : [],
            created_at: profileResult.data.created_at || new Date().toISOString(),
            updated_at: profileResult.data.updated_at || new Date().toISOString()
          } as AmbassadorProfile;
        } else {
          // Merge data, preferring ambassador_profiles but filling gaps from profiles
          finalProfile = {
            ...finalProfile,
            full_name: finalProfile.full_name || profileResult.data.full_name || '',
            email: finalProfile.email || profileResult.data.email || user.email || '',
            avatar_url: finalProfile.avatar_url || profileResult.data.avatar_url || '',
            speciality: finalProfile.speciality || profileResult.data.speciality || profileResult.data.specialty || '',
            specialty: finalProfile.specialty || profileResult.data.specialty || profileResult.data.speciality || '',
            specialties: finalProfile.specialties || profileResult.data.specialties || [],
            credentials: finalProfile.credentials || profileResult.data.credentials || '',
            location: finalProfile.location || profileResult.data.location || '',
            therapyTypes: finalProfile.therapyTypes || profileResult.data.therapyTypes || [],
            consultation_fee: finalProfile.consultation_fee || profileResult.data.consultation_fee || 0,
            isFree: finalProfile.isFree !== undefined ? finalProfile.isFree : profileResult.data.isFree,
          };
        }
      }
      
      // If we still don't have a profile, create from user metadata
      if (!finalProfile) {
        finalProfile = {
          id: user.id,
          ambassador_id: user.id,
          full_name: user.user_metadata?.full_name || 
                    `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 
                    user.email?.split('@')[0] || 'Ambassador',
          email: user.email || '',
          phone_number: user.user_metadata?.phone_number || '',
          bio: user.user_metadata?.bio || '',
          speciality: user.user_metadata?.speciality || user.user_metadata?.specialty || '',
          specialty: user.user_metadata?.specialty || user.user_metadata?.speciality || '',
          languages: user.user_metadata?.languages || [],
          education: user.user_metadata?.education || [],
          experience: user.user_metadata?.experience || [],
          availability_status: 'Available',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Calculate profile completeness
      const completenessPercentage = calculateProfileCompletion(finalProfile);
      setProfileCompleteness(completenessPercentage);
      
      setProfile(finalProfile);

      // Mock stats for now - would normally fetch from database
      setStats({
        totalSessions: 24,
        activeClients: 8,
        totalHours: 42,
        averageRating: 4.8,
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error("Couldn't load profile completely");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial profile fetch
  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl py-8 space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // Parse specialties from comma-separated string if available
  const specialties = profile?.specialties && profile.specialties.length > 0 ? 
    profile.specialties : 
    profile?.speciality ? 
      profile.speciality.split(',') : 
      profile?.specialty ? 
        profile.specialty.split(',') : [];

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ambassador Profile</h1>
            <p className="text-muted-foreground mt-1">
              Profile Completeness: {profileCompleteness}%
              {profileCompleteness < 80 && (
                <span className="text-red-500 ml-2">
                  (Complete at least 80% to be visible to patients)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleRefresh}
              className="border-blue-200 text-blue-600"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/ambassador-dashboard/clients')}
              className="border-blue-200 text-blue-600"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              View Clients
            </Button>
            <Button 
              onClick={() => navigate('/ambassador-dashboard/settings')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {profile ? (
          <div className="space-y-8">
            {/* Basic Info Card */}
            <Card className="overflow-hidden border-none shadow-md rounded-xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-32 relative">
                <div className="absolute -bottom-16 left-8">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-blue-700 text-white text-2xl">
                      {profile.full_name ? profile.full_name.charAt(0) : "A"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <CardContent className="pt-20 pb-6 px-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end">
                  <div>
                    <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-blue-100 border-blue-200 text-blue-700 font-medium">
                        Ambassador
                      </Badge>
                      {profile.credentials && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-200 text-purple-700 font-medium">
                          {profile.credentials}
                        </Badge>
                      )}
                      <Badge variant="outline" className={`${
                        profile.availability_status === 'Available' 
                          ? 'bg-green-100 border-green-200 text-green-700' 
                          : 'bg-amber-100 border-amber-200 text-amber-700'
                      } font-medium`}>
                        {profile.availability_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Ambassador since {format(new Date(profile.created_at), 'MMMM yyyy')}
                    </p>
                    {stats.averageRating > 0 && (
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-1 text-sm font-semibold">{stats.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  
                  {profile.phone_number && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone_number}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <MapPin className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{profile.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics & Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.totalSessions}</p>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.activeClients}</p>
                    <p className="text-sm text-muted-foreground">Active Clients</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.totalHours}</p>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 text-center">
                    <p className="text-2xl font-bold text-blue-700">{stats.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biography & Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Biography & Expertise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.bio && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      Biography
                    </h3>
                    <p className="text-sm text-slate-700">{profile.bio}</p>
                  </div>
                )}

                {specialties.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2 text-blue-600" />
                      Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty, index) => (
                        <Badge key={index} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                          {specialty.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.languages && profile.languages.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                      <Languages className="h-4 w-4 mr-2 text-blue-600" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((language, index) => (
                        <Badge key={index} variant="outline" className="bg-slate-50">
                          {language.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(profile.education) && profile.education.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                      Education
                    </h3>
                    <div className="space-y-2">
                      {profile.education.map((edu, index) => (
                        <div key={index} className="text-sm text-slate-700">
                          <p><strong>{edu.degree}</strong></p>
                          <p>{edu.university} • {edu.period}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(profile.experience) && profile.experience.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center">
                      <Monitor className="h-4 w-4 mr-2 text-blue-600" />
                      Professional Experience
                    </h3>
                    <div className="space-y-2">
                      {profile.experience.map((exp, index) => (
                        <div key={index} className="text-sm text-slate-700">
                          <p><strong>{exp.position}</strong></p>
                          <p>{exp.company} • {exp.period}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Consultation Fee & Availability */}
                <div>
                  <h3 className="text-md font-semibold mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Availability & Pricing
                  </h3>
                  <div className="text-sm text-slate-700">
                    <p>Status: <strong>{profile.availability_status}</strong></p>
                    {profile.isFree ? (
                      <p className="text-green-600 font-medium mt-1">Offering free consultations</p>
                    ) : (
                      <p className="mt-1">Consultation fee: <strong>${profile.consultation_fee?.toFixed(2) || '0.00'}</strong></p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Profile information not available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
