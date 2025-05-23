import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { moodMentorService } from "@/lib/moodMentorService";
import { profileService } from "@/lib/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCompletion } from "../components/ProfileCompletion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Save, X, Upload, PlusCircle, Trash2, User, BadgeCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import syncService from "@/services/syncService";
import { useConnection } from '@/contexts/ConnectionContext';
import { checkApiDirectly } from '@/utils/network';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define profile form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone_number: z.string().optional(),
  bio: z.string().min(20, "Bio should be at least 20 characters"),
  specialty: z.string().min(3, "Please enter your main specialty"),
  specialties: z.array(z.string()).optional(),
  credentials: z.string().optional(),
  location: z.string().min(2, "Please enter your location"),
  languages: z.array(z.string()).min(1, "Please select at least one language"),
  education: z.array(
    z.object({
      university: z.string().min(2, "University name is required"),
      degree: z.string().min(2, "Degree is required"),
      period: z.string().min(2, "Time period is required"),
    })
  ).optional(),
  experience: z.array(
    z.object({
      company: z.string().min(2, "Organization name is required"),
      position: z.string().min(2, "Position is required"),
      period: z.string().min(2, "Time period is required"),
    })
  ).optional(),
  avatar_url: z.string().optional(),
  availability_status: z.string().optional(),
  consultation_fee: z.number().optional(),
  isFree: z.boolean().optional(),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface MoodMentorProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  bio: string;
  speciality: string; 
  specialty?: string;
  specialties?: string[];
  credentials?: string;
  location?: string;
  languages: string[];
  education: any[];
  experience: any[];
  awards?: any[];
  availability_status: string;
  avatar_url: string;
  mentor_id: string;
  created_at: string;
  updated_at: string;
  therapyTypes?: any[];
  consultation_fee?: number;
  isFree?: boolean;
  profile_completion?: number;
  gender?: string;
}

export default function ProfileEditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isConnected, isOffline } = useConnection();
  const [profile, setProfile] = useState<MoodMentorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [apiStatus, setApiStatus] = useState<{apiConnected: boolean, databaseConnected: boolean}|null>(null);
  
  // Add state to track if current tab is valid/complete
  const [sectionValidity, setSectionValidity] = useState({
    "basic-info": false,
    "professional": false,
    "education": false,
    "services": false
  });

  // Add state to track which sections are read-only
  const [readOnlySections, setReadOnlySections] = useState({
    "basic-info": false,
    "professional": false,
    "education": false,
    "services": false
  });
  
  // Add state to track failed save attempts
  const [failedSaveAttempts, setFailedSaveAttempts] = useState(0);
  
  // Add saving status
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'retrying' | 'error' | 'success'>('idle');
  
  // Initialize form with default empty values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone_number: "",
      bio: "",
      specialty: "",
      specialties: [],
      credentials: "",
      location: "",
      languages: ["English"],
      education: [{ university: "", degree: "", period: "" }],
      experience: [{ company: "", position: "", period: "" }],
      avatar_url: "",
      availability_status: "Available",
      consultation_fee: 0,
      isFree: true,
      gender: ""
    }
  });
  
  // Function to calculate profile completion percentage
  const calculateProfileCompletion = (data: ProfileFormValues) => {
    // Calculate section weights (importance)
    const sectionWeights = {
      basicInfo: 0.25,   // 25% of total
      professional: 0.35, // 35% of total
      education: 0.25,   // 25% of total
      services: 0.15     // 15% of total
    };
    
    // Calculate completion for each section
    
    // Basic Info section completion (first name, last name, email are required)
    const basicInfoFields = ['firstName', 'lastName', 'email', 'location', 'gender', 'languages', 'phone_number'];
    const basicInfoRequired = ['firstName', 'lastName', 'email', 'location', 'gender', 'languages'];
    
    const completedBasicFields = basicInfoFields.filter(field => {
      const value = data[field as keyof ProfileFormValues];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return typeof value === 'string' && value.trim() !== '';
    }).length;
    
    const basicInfoCompletion = Math.min(completedBasicFields / basicInfoRequired.length, 1) * 100;
    
    // Professional section completion (bio and specialty are required)
    const professionalFields = ['bio', 'specialty', 'specialties', 'credentials'];
    const professionalRequired = ['bio', 'specialty'];
    
    const completedProfessionalFields = professionalFields.filter(field => {
      const value = data[field as keyof ProfileFormValues];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return typeof value === 'string' && value.trim() !== '';
    }).length;
    
    const professionalCompletion = Math.min(completedProfessionalFields / professionalRequired.length, 1) * 100;
    
    // Education section completion
    const hasCompleteEducation = data.education?.some(
      edu => edu.university?.trim().length >= 2 && 
             edu.degree?.trim().length >= 2 && 
             edu.period?.trim().length >= 2
    );
    
    const hasCompleteExperience = data.experience?.some(
      exp => exp.company?.trim().length >= 2 && 
             exp.position?.trim().length >= 2 && 
             exp.period?.trim().length >= 2
    );
    
    const educationCompletion = ((hasCompleteEducation ? 1 : 0) + (hasCompleteExperience ? 1 : 0)) / 2 * 100;
    
    // Services section completion
    const servicesFields = ['availability_status', 'consultation_fee', 'isFree'];
    const servicesRequired = ['availability_status'];
    
    const completedServicesFields = servicesFields.filter(field => {
      const value = data[field as keyof ProfileFormValues];
      if (typeof value === 'boolean') return true;
      if (typeof value === 'number') return true;
      return typeof value === 'string' && value.trim() !== '';
    }).length;
    
    const servicesCompletion = Math.min(completedServicesFields / servicesRequired.length, 1) * 100;
    
    // Calculate weighted total
    const weightedTotal = (
      (basicInfoCompletion / 100) * sectionWeights.basicInfo +
      (professionalCompletion / 100) * sectionWeights.professional +
      (educationCompletion / 100) * sectionWeights.education +
      (servicesCompletion / 100) * sectionWeights.services
    ) * 100;
    
    return Math.round(weightedTotal);
  };
  
  // Function to fetch profile data
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        return;
      }

      // Helper function to get proper full name
      const getProperFullName = (userData: any) => {
        // First check if full_name exists directly
        if (userData.full_name && userData.full_name.includes(" ")) {
          return userData.full_name;
        }
        
        // Next try to combine first_name and last_name from user_metadata
        if (userData.user_metadata) {
          if (userData.user_metadata.first_name && userData.user_metadata.last_name) {
            return `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`;
          }
          
          // Check if metadata has a properly formatted full_name
          if (userData.user_metadata.full_name && userData.user_metadata.full_name.includes(" ")) {
            return userData.user_metadata.full_name;
          }
        }
        
        // Try to extract from email as a last resort
        return userData.email?.split('@')[0] || '';
      };

      // Fetch profile data using our custom services
      const mentorProfile = await moodMentorService.getMentorProfile(user.id);
      
      if (!mentorProfile.error && mentorProfile.data) {
        const profileData = mentorProfile.data;
        
        // Get proper full name (with first and last name)
        const properFullName = profileData.full_name && profileData.full_name.includes(" ") 
          ? profileData.full_name
          : getProperFullName(user);
        
        // Split the full name into first and last name
        const { firstName, lastName } = splitFullName(properFullName);
        
        // Format the profile data
        const formattedProfile: MoodMentorProfile = {
          id: user.id,
          mentor_id: user.id,
          full_name: properFullName,
          email: profileData.email || user.email || '',
          phone_number: profileData.phone_number || '',
          bio: profileData.bio || '',
          speciality: profileData.speciality || profileData.specialty || '',
          specialty: profileData.specialty || profileData.speciality || '',
          specialties: profileData.specialties || [],
          credentials: profileData.credentials || '',
          location: profileData.location || '',
          languages: Array.isArray(profileData.languages) ? 
            profileData.languages : 
            (profileData.languages || '').split(',').filter(Boolean),
          education: Array.isArray(profileData.education) && profileData.education.length > 0 ? 
            profileData.education : 
            [{ university: "", degree: "", period: "" }],
          experience: Array.isArray(profileData.experience) && profileData.experience.length > 0 ? 
            profileData.experience : 
            [{ company: "", position: "", period: "" }],
          awards: profileData.awards || [],
          availability_status: profileData.availability_status || 'Available',
          avatar_url: profileData.avatar_url || '',
          created_at: profileData.created_at || new Date().toISOString(),
          updated_at: profileData.updated_at || new Date().toISOString(),
          therapyTypes: profileData.therapyTypes || [],
          consultation_fee: profileData.consultation_fee || 0,
          isFree: profileData.isFree !== undefined ? profileData.isFree : true,
          profile_completion: profileData.profile_completion || 0,
          gender: profileData.gender || ''
        };
        
        setProfile(formattedProfile);
        setAvatarPreview(formattedProfile.avatar_url || '');
        
        // Populate form with profile data
        const formData = {
          firstName,
          lastName,
          email: formattedProfile.email,
          phone_number: formattedProfile.phone_number,
          bio: formattedProfile.bio,
          specialty: formattedProfile.specialty || formattedProfile.speciality,
          specialties: formattedProfile.specialties || [],
          credentials: formattedProfile.credentials,
          location: formattedProfile.location || '',
          languages: formattedProfile.languages,
          education: formattedProfile.education.length > 0 ? formattedProfile.education : [{ university: "", degree: "", period: "" }],
          experience: formattedProfile.experience.length > 0 ? formattedProfile.experience : [{ company: "", position: "", period: "" }],
          avatar_url: formattedProfile.avatar_url,
          availability_status: formattedProfile.availability_status,
          consultation_fee: formattedProfile.consultation_fee,
          isFree: formattedProfile.isFree,
          gender: formattedProfile.gender
        };
        
        // Reset form and calculate completion percentage
        form.reset(formData);
        
        // Calculate profile completion percentage
        const completionPercentage = calculateProfileCompletion(formData);
        
        // If calculated completion differs from stored completion, update it
        if (completionPercentage !== profileData.profile_completion) {
          try {
            // Update profile completion in the database
            await moodMentorService.updateMentorProfile(user.id, {
              profile_completion: completionPercentage
            });
          } catch (error) {
            console.error('Error updating profile completion:', error);
          }
        }
      } else {
        // Create new profile if none exists
        console.log("No profile found, creating empty profile form");
        
        // Get proper full name (with first and last name)
        const properFullName = getProperFullName(user);
        
        // Split the full name into first and last name
        const { firstName, lastName } = splitFullName(properFullName);
        
        // Set empty profile with defaults from auth data if available
        const emptyProfile: MoodMentorProfile = {
          id: user.id,
          mentor_id: user.id,
          full_name: properFullName,
          email: user.email || '',
          phone_number: '',
          bio: '',
          speciality: user.user_metadata?.speciality || user.user_metadata?.specialty || '',
          specialty: user.user_metadata?.specialty || user.user_metadata?.speciality || '',
          specialties: user.user_metadata?.specialties || [],
          credentials: '',
          location: user.user_metadata?.country || '',
          languages: ['English'],
          education: [{ university: "", degree: "", period: "" }],
          experience: [{ company: "", position: "", period: "" }],
          availability_status: 'Available',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          gender: user.user_metadata?.gender || ''
        };
        
        setProfile(emptyProfile);
        
        // Reset form with empty profile but with user data where available
        const formData = {
          firstName,
          lastName,
          email: emptyProfile.email,
          phone_number: '',
          bio: '',
          specialty: emptyProfile.specialty || '',
          specialties: emptyProfile.specialties || [],
          credentials: '',
          location: user.user_metadata?.country || '',
          languages: ['English'],
          education: [{ university: "", degree: "", period: "" }],
          experience: [{ company: "", position: "", period: "" }],
          avatar_url: emptyProfile.avatar_url || '',
          availability_status: 'Available',
          consultation_fee: 0,
          isFree: true,
          gender: user.user_metadata?.gender || ''
        };
        
        form.reset(formData);
        
        // Calculate and save initial profile completion
        const initialCompletion = calculateProfileCompletion(formData);
        try {
          await moodMentorService.updateMentorProfile(user.id, {
            profile_completion: initialCompletion
          });
        } catch (error) {
          console.error('Error updating initial profile completion:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Couldn't load profile data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update the checkApiStatus function to force connection or show error dialog
  const checkApiStatus = async (forceConnection = false) => {
    try {
      const status = await checkApiDirectly();
      setApiStatus(status);
      
      // If we're forcing a connection and have an error
      if (forceConnection && (!status?.apiConnected || !status?.databaseConnected)) {
        // Display a more helpful error message to the user
        toast.error(
          `Could not connect to the server: ${status?.error || 'Unknown error'}`,
          { duration: 6000 }
        );
        setSavingStatus('error');
        return null;
      }
      
      return status;
    } catch (error) {
      console.error("API status check failed:", error);
      
      if (forceConnection) {
        toast.error(
          "Cannot connect to the server. Please check your connection and try again.",
          { duration: 6000 }
        );
        setSavingStatus('error');
      }
      
      return null;
    }
  };
  
  // Function to retry API calls
  const retryApiCall = async <T,>(
    apiCall: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setSavingStatus('retrying');
          toast.info(`Retrying... (attempt ${attempt + 1}/${maxRetries})`);
        }
        
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.error(`API call failed (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        if (attempt < maxRetries - 1) {
          // Wait before retrying with exponential backoff
          const delay = initialDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };
  
  // Update the onSubmit function to use retries and force server connection
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setSavingStatus('saving');
      setIsSaving(true);
      
      // Force API status check to ensure we're connected
      const apiStatus = await checkApiStatus(true);
      
      // If API check failed and we're forcing connection, return - error toast already shown
      if (!apiStatus) {
        setIsSaving(false);
        return;
      }
      
      const canUseApi = apiStatus.apiConnected && apiStatus.databaseConnected;
      
      // If API is not available and this isn't a retry, show error and exit
      if (!canUseApi && failedSaveAttempts === 0) {
        toast.error(
          "Cannot connect to the server. Please check your connection.",
          { duration: 5000 }
        );
        setFailedSaveAttempts(prev => prev + 1);
        setIsSaving(false);
        setSavingStatus('error');
        return;
      }
      
      // Show saving indicator in UI
      toast.loading("Saving your profile...");
      
      // Combine first and last name into full_name
      const full_name = `${data.firstName} ${data.lastName}`.trim();
      
      // Upload avatar if there's a new one
      let avatarUrl = profile?.avatar_url || '';
      if (avatarFile) {
        try {
          const avatarUploadFormData = new FormData();
          avatarUploadFormData.append('file', avatarFile);
          avatarUploadFormData.append('userId', user.id);
          
          // Use retry mechanism for avatar upload
          const uploadResult = await retryApiCall(
            () => moodMentorService.uploadProfileImage(avatarUploadFormData),
            3,
            1000
          );
          
          if (!uploadResult.error && uploadResult.data) {
            avatarUrl = uploadResult.data.url;
          } else {
            throw new Error(uploadResult.error || "Failed to upload image");
          }
        } catch (uploadError) {
          console.error("Avatar upload failed after retries:", uploadError);
          // Continue with profile save even if avatar upload fails
          // We'll keep the existing avatar
          toast.error("Failed to upload profile image, but continuing with profile save");
        }
      }
      
      // Calculate profile completion percentage
      const completionPercentage = calculateProfileCompletion(data);
      
      // Prepare the profile data updates
      const baseUpdates = {
        id: user.id,
        full_name,
        email: data.email,
        phone_number: data.phone_number || '',
        bio: data.bio,
        specialty: data.specialty,
        speciality: data.specialty, // Handle both spellings for compatibility
        location: data.location,
        availability_status: data.availability_status || 'Available',
        consultation_fee: data.consultation_fee || 0,
        isFree: data.isFree !== undefined ? data.isFree : true,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
        profile_completion: completionPercentage,
        gender: data.gender
      };
      
      // Add the array and JSON fields
      const complexUpdates = {
        specialties: data.specialties || [],
        languages: data.languages,
        education: data.education?.map(edu => ({
          university: edu.university || "",
          degree: edu.degree || "",
          period: edu.period || ""
        })) || [],
        experience: data.experience?.map(exp => ({
          company: exp.company || "",
          position: exp.position || "",
          period: exp.period || "",
          duration: exp.period || "" // Use period as duration to satisfy the type
        })) || [],
        credentials: data.credentials,
      };
      
      // Combine all updates
      const updates = { ...baseUpdates, ...complexUpdates };
      
      // Use retry mechanism for profile update
      try {
        const updateResult = await retryApiCall(
          () => moodMentorService.updateMentorProfile(user.id, updates),
          3,
          1000
        );
        
        if (!updateResult.error) {
          toast.success("Profile updated successfully!");
          setSavingStatus('success');
          
          // After a brief delay, navigate back to the dashboard
          setTimeout(() => {
            navigate('/mood-mentor-dashboard');
          }, 1500);
        } else {
          throw new Error(updateResult.error);
        }
      } catch (updateError) {
        console.error("Error updating profile after retries:", updateError);
        
        // If we've already tried local saving multiple times, show a more serious error
        if (failedSaveAttempts >= 2) {
          toast.error(
            "Failed to save profile after multiple attempts. Please try again later or contact support.",
            { duration: 8000 }
          );
        } else {
          toast.error(
            "Failed to update profile. Please try again.",
            { duration: 5000 }
          );
          setFailedSaveAttempts(prev => prev + 1);
        }
        setSavingStatus('error');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An error occurred while saving your profile");
      setSavingStatus('error');
    } finally {
      setIsSaving(false);
      toast.dismiss();
    }
  };
  
  // Function to set a section as read-only when moving to the next section
  const setCurrentSectionReadOnly = (section: string) => {
    setReadOnlySections(prev => ({
      ...prev,
      [section]: true
    }));
  };
  
  // Modified validateAndNavigate function to set sections as read-only
  const validateAndNavigate = (currentTab: string, nextTab: string) => {
    let isValid = false;
    
    // Validate current tab
    switch (currentTab) {
      case "basic-info":
        isValid = isBasicInfoComplete();
        break;
      case "professional":
        isValid = isProfessionalInfoComplete();
        break;
      case "education":
        isValid = isEducationExpComplete();
        break;
      case "services":
        isValid = isServicesComplete();
        break;
      default:
        isValid = true;
    }
    
    // Update section validity state
    setSectionValidity(prev => ({
      ...prev,
      [currentTab]: isValid
    }));
    
    // Navigate to next tab if valid
    if (isValid) {
      // Set the current section as read-only
      setCurrentSectionReadOnly(currentTab);
      setActiveTab(nextTab);
    } else {
      // Show error message
      toast.error("Please complete all required fields before proceeding");
      
      // Trigger form validation to show error messages
      form.trigger();
    }
  };
  
  // Function to split full name into first and last name
  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    return { firstName, lastName };
  };
  
  // Function to check if the basic info section is complete
  const isBasicInfoComplete = () => {
    const values = form.getValues();
    return (
      values.firstName?.trim().length >= 2 &&
      values.lastName?.trim().length >= 2 &&
      /\S+@\S+\.\S+/.test(values.email) &&
      values.location?.trim().length >= 2 &&
      values.gender?.trim().length > 0 &&
      values.languages?.length > 0
    );
  };

  // Function to check if the professional info section is complete
  const isProfessionalInfoComplete = () => {
    const values = form.getValues();
    return (
      values.bio?.trim().length >= 20 &&
      values.specialty?.trim().length >= 3
    );
  };

  // Function to check if the education and experience section is complete
  const isEducationExpComplete = () => {
    const values = form.getValues();
    
    // Check if at least one education entry is complete
    const hasCompleteEducation = values.education?.some(
      edu => edu.university?.trim().length >= 2 && 
             edu.degree?.trim().length >= 2 && 
             edu.period?.trim().length >= 2
    );
    
    // Check if at least one experience entry is complete
    const hasCompleteExperience = values.experience?.some(
      exp => exp.company?.trim().length >= 2 && 
             exp.position?.trim().length >= 2 && 
             exp.period?.trim().length >= 2
    );
    
    return hasCompleteEducation && hasCompleteExperience;
  };

  // Function to check if the services section is complete
  const isServicesComplete = () => {
    const values = form.getValues();
    return values.availability_status?.trim().length > 0;
  };
  
  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, [user]);
  
  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Your Profile</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/mood-mentor-dashboard')}
            >
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <ProfileCompletion profile={profile} sectionValidity={sectionValidity} />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Tabs defaultValue="basic-info" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                    <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                    <TabsTrigger value="professional">Professional</TabsTrigger>
                    <TabsTrigger value="education">Education & Experience</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                  </TabsList>
                  
                  {/* Basic Info Tab */}
                  <TabsContent value="basic-info" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
                          <div className="relative group">
                            <Avatar className="h-24 w-24">
                              <AvatarImage 
                                src={avatarPreview || profile?.avatar_url} 
                                alt={profile?.full_name} 
                              />
                              <AvatarFallback className="bg-blue-500 text-white text-xl">
                                {profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Label htmlFor="avatar-upload" className="cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/40 transition">
                                <Upload className="h-5 w-5 text-white" />
                              </Label>
                              <input 
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setAvatarFile(e.target.files[0]);
                                    setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Profile Photo</h3>
                              <p className="text-sm text-gray-500">
                                Upload a professional photo for your profile. Clear headshots work best.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Label
                                htmlFor="avatar-upload"
                                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload New
                              </Label>
                              {avatarPreview && (
                                <Button 
                                  variant="outline"
                                  type="button"
                                  onClick={() => {
                                    setAvatarFile(null);
                                    setAvatarPreview(profile?.avatar_url || '');
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      
                        {/* Name - split into first name and last name */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="First name"
                                    {...field}
                                    disabled={readOnlySections["basic-info"]}
                                    className={readOnlySections["basic-info"] ? "bg-slate-50" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Last name"
                                    {...field}
                                    disabled={readOnlySections["basic-info"]}
                                    className={readOnlySections["basic-info"] ? "bg-slate-50" : ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Email */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} disabled className="bg-muted cursor-not-allowed" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Phone Number */}
                        <FormField
                          control={form.control}
                          name="phone_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Location */}
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="City, Country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Gender */}
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="non-binary">Non-binary</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Languages */}
                        <div>
                          <Label>Languages</Label>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {["English", "French", "Spanish", "Arabic", "Kinyarwanda", "Swahili"].map((lang) => (
                              <div 
                                key={lang}
                                className={`px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors ${
                                  form.watch("languages")?.includes(lang)
                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                    : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                                }`}
                                onClick={() => {
                                  const currentLangs = form.watch("languages") || [];
                                  const newLangs = currentLangs.includes(lang)
                                    ? currentLangs.filter(l => l !== lang)
                                    : [...currentLangs, lang];
                                  form.setValue("languages", newLangs);
                                }}
                              >
                                {lang}
                              </div>
                            ))}
                          </div>
                          {form.formState.errors.languages && (
                            <p className="text-sm font-medium text-destructive mt-1.5">
                              {form.formState.errors.languages.message}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => navigate('/mood-mentor-dashboard')}>
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => validateAndNavigate("basic-info", "professional")}
                        disabled={!sectionValidity["basic-info"]}
                      >
                        Next: Professional Info
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Professional Tab */}
                  <TabsContent value="professional" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Professional Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Bio */}
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your professional background, approach to therapy, and what patients can expect when working with you..." 
                                  className="min-h-[150px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Credentials */}
                        <FormField
                          control={form.control}
                          name="credentials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credentials</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="MSc in Clinical Psychology, Certified Trauma Counselor, etc." 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Specialty */}
                        <FormField
                          control={form.control}
                          name="specialty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Specialty</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Depression & Anxiety, Trauma Recovery" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Specialties */}
                        <div>
                          <Label>Areas of Specialization</Label>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {[
                              "Depression", "Anxiety", "Trauma", "PTSD", "Stress Management", 
                              "Grief", "Addiction", "Self-Esteem", "General Mental Health"
                            ].map((specialty) => (
                              <div 
                                key={specialty}
                                className={`px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors ${
                                  form.watch("specialties")?.includes(specialty)
                                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                                    : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                                }`}
                                onClick={() => {
                                  const currentSpecs = form.watch("specialties") || [];
                                  const newSpecs = currentSpecs.includes(specialty)
                                    ? currentSpecs.filter(s => s !== specialty)
                                    : [...currentSpecs, specialty];
                                  form.setValue("specialties", newSpecs);
                                }}
                              >
                                {specialty}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("basic-info")}>
                        Previous: Basic Info
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => validateAndNavigate("professional", "education")}
                        disabled={!sectionValidity["professional"]}
                      >
                        Next: Education & Experience
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Education & Experience Tab */}
                  <TabsContent value="education" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Education</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {form.watch("education")?.map((_, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Education #{index + 1}</h4>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentEducation = form.watch("education") || [];
                                    form.setValue(
                                      "education",
                                      currentEducation.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name={`education.${index}.university`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>University/Institution</FormLabel>
                                    <FormControl>
                                      <Input placeholder="University of Rwanda" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`education.${index}.degree`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Degree/Certification</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MSc in Clinical Psychology" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`education.${index}.period`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time Period</FormLabel>
                                    <FormControl>
                                      <Input placeholder="2015 - 2018" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const currentEducation = form.watch("education") || [];
                            form.setValue("education", [
                              ...currentEducation,
                              { university: "", degree: "", period: "" }
                            ]);
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Experience</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {form.watch("experience")?.map((_, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Experience #{index + 1}</h4>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentExperience = form.watch("experience") || [];
                                    form.setValue(
                                      "experience",
                                      currentExperience.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name={`experience.${index}.company`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Organization</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Kigali Mental Health Center" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`experience.${index}.position`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Senior Counselor" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`experience.${index}.period`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time Period</FormLabel>
                                    <FormControl>
                                      <Input placeholder="2018 - Present" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const currentExperience = form.watch("experience") || [];
                            form.setValue("experience", [
                              ...currentExperience,
                              { company: "", position: "", period: "" }
                            ]);
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("professional")}>
                        Previous: Professional Info
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => validateAndNavigate("education", "services")}
                        disabled={!sectionValidity["education"]}
                      >
                        Next: Services
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Services Tab */}
                  <TabsContent value="services" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Services & Availability</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="availability_status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Availability Status</FormLabel>
                              <div className="flex gap-4 mt-1.5">
                                {["Available", "Limited Availability", "Fully Booked", "On Leave"].map((status) => (
                                  <div
                                    key={status}
                                    className={`px-4 py-2 rounded-md cursor-pointer border ${
                                      field.value === status
                                        ? "bg-blue-50 border-blue-300 text-blue-800"
                                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => field.onChange(status)}
                                  >
                                    {status}
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="isFree"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Type</FormLabel>
                                <div className="flex gap-4 mt-1.5">
                                  <div
                                    className={`px-4 py-2 rounded-md cursor-pointer border ${
                                      field.value === true
                                        ? "bg-blue-50 border-blue-300 text-blue-800"
                                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => field.onChange(true)}
                                  >
                                    Free Volunteer Service
                                  </div>
                                  <div
                                    className={`px-4 py-2 rounded-md cursor-pointer border ${
                                      field.value === false
                                        ? "bg-blue-50 border-blue-300 text-blue-800"
                                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                    }`}
                                    onClick={() => field.onChange(false)}
                                  >
                                    Paid Service
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {form.watch("isFree") === false && (
                            <FormField
                              control={form.control}
                              name="consultation_fee"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Consultation Fee (USD)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="25" 
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex items-center justify-between pt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("education")}>
                        Previous: Education & Experience
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 text-white" 
                        disabled={isSaving || !sectionValidity["services"]}
                      >
                        {isSaving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              Unable to load profile data. Please try again later.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
} 