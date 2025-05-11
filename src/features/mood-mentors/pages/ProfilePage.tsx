import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { moodMentorService } from "@/lib/moodMentorService";
import { toast } from "sonner";
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail, 
  Languages, 
  Award,
  Calendar,
  Edit,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MoodMentorProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  bio: string;
  specialty?: string;
  speciality?: string;
  specialties?: string[];
  therapyTypes?: string[] | { name: string; iconName: string }[];
  location?: string;
  languages: string[];
  education: any[];
  experience: any[];
  credentials?: string;
  availability_status: string;
  avatar_url: string;
  profile_completion?: number;
  consultation_fee?: number;
  isFree?: boolean;
  created_at: string;
  updated_at: string;
}

// Define section label component to replace FormLabel
const SectionLabel = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="flex items-center gap-2 font-medium text-sm mb-2">
    {icon}
    <span>{children}</span>
  </div>
);

// Define info field component
const InfoField = ({ label, icon, value }: { label: string, icon: React.ReactNode, value: string | undefined }) => (
  <div className="space-y-2">
    <SectionLabel icon={icon}>{label}</SectionLabel>
    <div className="p-2 bg-gray-50 rounded border border-gray-100">
      {value || <span className="text-gray-400">Not specified</span>}
    </div>
  </div>
);

// Define text area info field
const TextAreaInfoField = ({ label, icon, value }: { label: string, icon: React.ReactNode, value: string | undefined }) => (
  <div className="space-y-2">
    <SectionLabel icon={icon}>{label}</SectionLabel>
    <div className="p-3 bg-gray-50 rounded border border-gray-100 min-h-[120px]">
      {value || <span className="text-gray-400">No information available</span>}
    </div>
  </div>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MoodMentorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completedSections, setCompletedSections] = useState<{[key: string]: boolean}>({
    basic: false,
    contact: false,
    bio: false,
    specialties: false,
    credentials: false,
    education: false,
    experience: false
  });
  
  // Function to calculate profile completion
  const calculateProfileCompletion = (profileData: MoodMentorProfile) => {
    // Check if therapyTypes exist and extract appropriately
    const hasTherapyTypes = Array.isArray(profileData.therapyTypes) && profileData.therapyTypes.length > 0;
    
    const sections: {[key: string]: boolean} = {
      basic: !!profileData.full_name && profileData.full_name.length > 2,
      contact: !!profileData.email && !!profileData.phone_number,
      bio: !!profileData.bio && profileData.bio.length >= 20,
      specialties: (
        (!!profileData.specialty || !!profileData.speciality) && 
        (Array.isArray(profileData.specialties) && profileData.specialties.length > 0) &&
        hasTherapyTypes
      ),
      credentials: !!profileData.credentials,
      education: Array.isArray(profileData.education) && profileData.education.length > 0 && 
                profileData.education.some(edu => edu.university && edu.degree),
      experience: Array.isArray(profileData.experience) && profileData.experience.length > 0 && 
                profileData.experience.some(exp => exp.company && exp.position)
    };
    
    setCompletedSections(sections);
    
    const completedSectionCount = Object.values(sections).filter(Boolean).length;
    const totalSections = Object.keys(sections).length;
    const percentage = Math.round((completedSectionCount / totalSections) * 100);
    
    return percentage;
  };
  
  // Function to fetch profile data
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const mentorProfile = await moodMentorService.getMentorProfile(user.id);
      
      if (!mentorProfile.error && mentorProfile.data) {
        const profileData = mentorProfile.data;
        
        // Format profile data
        const formattedProfile: MoodMentorProfile = {
          id: user.id,
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || '',
          phone_number: profileData.phone_number || '',
          bio: profileData.bio || '',
          specialty: profileData.specialty || profileData.speciality || '',
          speciality: profileData.speciality || profileData.specialty || '',
          location: profileData.location || '',
          languages: Array.isArray(profileData.languages) ? 
            profileData.languages : 
            (profileData.languages || '').split(',').filter(Boolean),
          education: Array.isArray(profileData.education) && profileData.education.length > 0 ? 
            profileData.education : 
            [],
          experience: Array.isArray(profileData.experience) && profileData.experience.length > 0 ? 
            profileData.experience : 
            [],
          credentials: profileData.credentials || '',
          availability_status: profileData.availability_status || 'Available',
          avatar_url: profileData.avatar_url || '',
          profile_completion: profileData.profile_completion || 0,
          consultation_fee: profileData.consultation_fee,
          isFree: profileData.isFree,
          created_at: profileData.created_at || new Date().toISOString(),
          updated_at: profileData.updated_at || new Date().toISOString(),
          specialties: profileData.specialties || [
            "Depression", "Anxiety", "Trauma Recovery", "Grief Counseling"
          ],
          therapyTypes: profileData.therapyTypes || [
            "Cognitive Behavioral Therapy", "EMDR", "Mindfulness-Based Therapy"
          ],
        };
        
        setProfile(formattedProfile);
        const calculatedCompletion = calculateProfileCompletion(formattedProfile);
        setProfileCompletion(calculatedCompletion);
        
        // If calculated completion differs from stored completion, update it
        if (calculatedCompletion !== formattedProfile.profile_completion) {
          try {
            await updateProfileWithRetry({
              profile_completion: calculatedCompletion
            });
          } catch (error) {
            console.error('Error updating profile completion:', error);
          }
        }
      } else {
        // Create empty profile if none exists
        const emptyProfile: MoodMentorProfile = {
          id: user.id,
          full_name: user.email?.split('@')[0] || '',
          email: user.email || '',
          phone_number: '',
          bio: '',
          specialty: '',
          location: '',
          languages: ['English'],
          education: [],
          experience: [],
          credentials: '',
          availability_status: 'Available',
          avatar_url: '',
          profile_completion: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setProfile(emptyProfile);
        setProfileCompletion(0);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Couldn't load profile data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update profile with retry logic
  const updateProfileWithRetry = async (updates: Partial<MoodMentorProfile>, maxRetries = 3) => {
    if (!user) return;
    
    // Convert therapyTypes to the correct format if needed
    let formattedUpdates: any = { ...updates };
    
    // Check if therapyTypes exists in the updates and needs conversion
    if (updates.therapyTypes && Array.isArray(updates.therapyTypes)) {
      // Convert string[] to object[] if needed
      if (typeof updates.therapyTypes[0] === 'string') {
        formattedUpdates.therapyTypes = (updates.therapyTypes as string[]).map(type => ({
          name: type,
          iconName: 'default-icon'
        }));
      }
    }
    
    let retries = 0;
    let success = false;
    
    while (retries < maxRetries && !success) {
      try {
        const result = await moodMentorService.updateMentorProfile(user.id, formattedUpdates);
        
        if (result.error) {
          console.error(`Update attempt ${retries + 1} failed:`, result.error);
          retries++;
          
          if (retries >= maxRetries) {
            toast.error("Failed to update profile after multiple attempts");
            throw new Error("Max retries reached");
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        } else {
          success = true;
          return result;
        }
      } catch (error) {
        console.error(`Update attempt ${retries + 1} failed with exception:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          toast.error("Failed to update profile. Network or server error.");
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };
  
  // Function to handle completing profile
  const handleCompleteProfile = () => {
    navigate('/mood-mentor-dashboard/profile/edit');
  };
  
  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, [user]);
  
  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your professional profile information
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchProfile}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/mood-mentor-dashboard/profile/edit')}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-6">
            <div className="w-full h-24 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Completion Card */}
            <Card className={`${profileCompletion < 100 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {profileCompletion < 100 
                        ? "Complete Your Profile" 
                        : "Profile Complete!"
                      }
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {profileCompletion < 100 
                        ? "A complete profile helps patients find and connect with you" 
                        : "Your profile looks great and is fully visible to patients"
                      }
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={profileCompletion} 
                        className="w-48 h-2"
                        style={{
                          ['--progress-background']: profileCompletion === 100 ? 'var(--green-500)' : 'var(--blue-500)'
                        } as React.CSSProperties}
                      />
                      <span className="text-sm font-medium">
                        {profileCompletion}%
                      </span>
                    </div>
                  </div>
                  
                  {profileCompletion < 100 && (
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={handleCompleteProfile}
                        className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white"
                      >
                        Complete Profile
                      </Button>
                      <div className="text-sm text-gray-600 mt-1">
                        <ul className="space-y-1">
                          {!completedSections.basic && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Basic information</li>
                          )}
                          {!completedSections.contact && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Contact details</li>
                          )}
                          {!completedSections.bio && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Professional bio</li>
                          )}
                          {!completedSections.specialties && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Specialties</li>
                          )}
                          {!completedSections.education && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Education</li>
                          )}
                          {!completedSections.experience && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Experience</li>
                          )}
                          {!completedSections.credentials && (
                            <li className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Credentials</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Main Profile Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your public profile information visible to patients
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Header with Avatar */}
                <div className="flex flex-col sm:flex-row gap-6 items-start pb-4 border-b">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={profile.avatar_url} 
                      alt={profile.full_name} 
                    />
                    <AvatarFallback className="bg-blue-500 text-white text-xl">
                      {profile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">{profile.full_name}</h2>
                    <p className="text-gray-600">{profile.specialty || profile.speciality}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {profile.availability_status}
                      </Badge>
                      {profile.credentials && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bio */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <TextAreaInfoField 
                        label="Bio" 
                        icon={<User className="h-4 w-4" />} 
                        value={profile.bio} 
                      />
                      {completedSections.bio ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel icon={<Mail className="h-4 w-4" />}>Contact Information</SectionLabel>
                      {completedSections.contact ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-4">
                      <InfoField 
                        label="Email" 
                        icon={<Mail className="h-4 w-4" />} 
                        value={profile.email} 
                      />
                      
                      <InfoField 
                        label="Phone" 
                        icon={<Phone className="h-4 w-4" />} 
                        value={profile.phone_number} 
                      />
                    </div>
                  </div>
                  
                  {/* Location & Languages */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel icon={<MapPin className="h-4 w-4" />}>Location & Languages</SectionLabel>
                      {completedSections.basic ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-4">
                      <InfoField 
                        label="Location" 
                        icon={<MapPin className="h-4 w-4" />} 
                        value={profile.location} 
                      />
                      
                      <div className="space-y-2">
                        <SectionLabel icon={<Languages className="h-4 w-4" />}>Languages</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                          {profile.languages && profile.languages.length > 0 ? (
                            profile.languages.map((lang) => (
                              <Badge key={lang} variant="outline" className="bg-gray-50">
                                {lang}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">No languages specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credentials */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <SectionLabel icon={<Award className="h-4 w-4" />}>Credentials</SectionLabel>
                      {completedSections.credentials ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                        </Badge>
                      )}
                    </div>
                    <InfoField 
                      label="Credentials" 
                      icon={<Award className="h-4 w-4" />} 
                      value={profile.credentials} 
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Specialties & Therapy Types */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Areas of Expertise
                    </h3>
                    {completedSections.specialties ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                    {/* Specialties */}
                    <div>
                      <SectionLabel icon={<User className="h-4 w-4" />}>Specialties</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {profile.specialties && profile.specialties.length > 0 ? (
                          profile.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="bg-gray-50 px-3 py-1">
                              {specialty}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No specialties specified</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Therapy Types */}
                    <div>
                      <SectionLabel icon={<GraduationCap className="h-4 w-4" />}>Therapy Approaches</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {profile.therapyTypes && profile.therapyTypes.length > 0 ? (
                          profile.therapyTypes.map((type) => (
                            <Badge key={type} variant="outline" className="bg-gray-50 px-3 py-1">
                              {type}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No therapy approaches specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Fees and Availability */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fees & Availability
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                    {/* Service Type */}
                    <div>
                      <SectionLabel icon={<Award className="h-4 w-4" />}>Service Type</SectionLabel>
                      <Badge className={`px-3 py-1 ${profile.isFree ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {profile.isFree ? "Free" : "Paid Service"}
                      </Badge>
                    </div>
                    
                    {/* Consultation Fee if not free */}
                    {!profile.isFree && profile.consultation_fee !== undefined && (
                      <div>
                        <SectionLabel icon={<Award className="h-4 w-4" />}>Consultation Fee</SectionLabel>
                        <div className="text-lg font-semibold">
                          ${profile.consultation_fee} <span className="text-sm font-normal text-gray-500">per session</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Paid option - always displayed but disabled when free */}
                    {profile.isFree && (
                      <div>
                        <SectionLabel icon={<Award className="h-4 w-4" />}>Consultation Fee</SectionLabel>
                        <div className="text-lg text-gray-400">
                          <span className="line-through">${profile.consultation_fee || 0}</span> <span className="text-sm font-normal text-gray-400">per session (disabled)</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Availability Status */}
                    <div>
                      <SectionLabel icon={<Calendar className="h-4 w-4" />}>Availability Status</SectionLabel>
                      <Badge className={`px-3 py-1 ${
                        profile.availability_status === 'Available' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : profile.availability_status === 'Limited Availability'
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {profile.availability_status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Education */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </h3>
                    {completedSections.education ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                      </Badge>
                    )}
                  </div>
                  
                  {profile.education && profile.education.length > 0 ? (
                    profile.education.map((edu: any, index: number) => (
                      <div key={index} className="mb-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                        <h4 className="font-medium">{edu?.university || ''}</h4>
                        <p className="text-sm text-gray-600">{edu?.degree || ''}</p>
                        <p className="text-xs text-gray-500 mt-1">{edu?.period || ''}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No education information available</p>
                  )}
                </div>

                <Separator />

                {/* Experience */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Experience
                    </h3>
                    {completedSections.experience ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                      </Badge>
                    )}
                  </div>
                  
                  {profile.experience && profile.experience.length > 0 ? (
                    profile.experience.map((exp: any, index: number) => (
                      <div key={index} className="mb-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                        <h4 className="font-medium">{exp?.position || ''}</h4>
                        <p className="text-sm text-gray-600">{exp?.company || ''}</p>
                        <p className="text-xs text-gray-500 mt-1">{exp?.period || ''}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No experience information available</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Missing Information Alert - Shown if profile is incomplete */}
            {profileCompletion < 100 && (
              <div className="space-y-4">
                <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>Your profile is incomplete. Complete all required fields to maximize visibility to potential patients.</span>
                    <Button
                      onClick={handleCompleteProfile}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white ml-4"
                    >
                      Complete Now
                    </Button>
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!completedSections.basic && (
                    <Card className="border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Basic Information</span>
                          </div>
                          <Button
                            onClick={() => navigate('/mood-mentor-dashboard/profile/edit')}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!completedSections.bio && (
                    <Card className="border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Professional Bio</span>
                          </div>
                          <Button
                            onClick={() => navigate('/mood-mentor-dashboard/profile/edit')}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!completedSections.specialties && (
                    <Card className="border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Specialties & Therapy Types</span>
                          </div>
                          <Button
                            onClick={() => navigate('/mood-mentor-dashboard/profile/edit?tab=professional')}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!completedSections.education && (
                    <Card className="border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Education History</span>
                          </div>
                          <Button
                            onClick={() => navigate('/mood-mentor-dashboard/profile/edit?tab=education')}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!completedSections.experience && (
                    <Card className="border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Professional Experience</span>
                          </div>
                          <Button
                            onClick={() => navigate('/mood-mentor-dashboard/profile/edit?tab=education')}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              Unable to load profile data. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage; 