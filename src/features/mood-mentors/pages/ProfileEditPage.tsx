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

// Define profile form schema
const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
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
  isFree: z.boolean().optional()
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
}

export default function ProfileEditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MoodMentorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  
  // Initialize form with default empty values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
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
      isFree: true
    }
  });
  
  // Function to fetch profile data
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        return;
      }

      // Fetch profile data using our custom services
      const mentorProfile = await moodMentorService.getMentorProfile(user.id);
      
      if (!mentorProfile.error && mentorProfile.data) {
        const profileData = mentorProfile.data;
        
        // Format the profile data
        const formattedProfile: MoodMentorProfile = {
          id: user.id,
          mentor_id: user.id,
          full_name: profileData.full_name || '',
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
          isFree: profileData.isFree !== undefined ? profileData.isFree : true
        };
        
        setProfile(formattedProfile);
        setAvatarPreview(formattedProfile.avatar_url || '');
        
        // Populate form with profile data
        form.reset({
          full_name: formattedProfile.full_name,
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
          isFree: formattedProfile.isFree
        });
      } else {
        // Create new profile if none exists
        console.log("No profile found, creating empty profile form");
        
        // Set empty profile
        const emptyProfile: MoodMentorProfile = {
          id: user.id,
          mentor_id: user.id,
          full_name: user.email?.split('@')[0] || '',
          email: user.email || '',
          phone_number: '',
          bio: '',
          speciality: '',
          specialty: '',
          specialties: [],
          languages: ['English'],
          education: [{ university: "", degree: "", period: "" }],
          experience: [{ company: "", position: "", period: "" }],
          availability_status: 'Available',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProfile(emptyProfile);
        
        // Reset form with empty profile
        form.reset({
          full_name: emptyProfile.full_name,
          email: emptyProfile.email,
          phone_number: '',
          bio: '',
          specialty: '',
          specialties: [],
          credentials: '',
          location: '',
          languages: ['English'],
          education: [{ university: "", degree: "", period: "" }],
          experience: [{ company: "", position: "", period: "" }],
          avatar_url: '',
          availability_status: 'Available',
          consultation_fee: 0,
          isFree: true
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Couldn't load profile data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast.error("You must be logged in to save your profile");
      return;
    }

    try {
      setIsSaving(true);

      // Handle avatar upload if a new one was selected
      let avatarUrl = profile?.avatar_url || '';
      
      if (avatarFile) {
        try {
          // Create a form data object for the avatar upload
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          formData.append('userId', user.id);
          
          // Upload avatar using moodMentorService instead of profileService
          const uploadResult = await moodMentorService.uploadProfileImage(formData);
          
          if (uploadResult && uploadResult.data && uploadResult.data.url) {
            avatarUrl = uploadResult.data.url;
          } else {
            toast.error("Failed to upload profile image. Using previous image.");
          }
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast.error("Failed to upload profile image. Your profile will be saved without the new image.");
        }
      }
      
      // Calculate profile completion percentage
      const completionPercentage = calculateProfileCompletion(data);
      
      // Prepare the profile data updates
      const baseUpdates = {
        id: user.id,
        full_name: data.full_name,
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
        profile_completion: completionPercentage
      };
      
      // Add the array and JSON fields
      const complexUpdates = {
        specialties: data.specialties || [],
        languages: data.languages,
        education: data.education || [],
        experience: data.experience || [],
        credentials: data.credentials,
      };
      
      // Combine all updates
      const updates = { ...baseUpdates, ...complexUpdates };
      
      // Update the profile using our service
      const updateResult = await moodMentorService.updateMentorProfile(user.id, updates);
      
      if (!updateResult.error) {
        toast.success("Profile updated successfully!");
        // After a brief delay, navigate back to the dashboard
        setTimeout(() => {
          navigate('/mood-mentor-dashboard');
        }, 1500);
      } else {
        console.error("Error updating profile:", updateResult.error);
        toast.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An error occurred while saving your profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to calculate profile completion percentage
  const calculateProfileCompletion = (data: ProfileFormValues) => {
    let completedSections = 0;
    let totalSections = 7; // Total number of important profile sections
    
    // Personal info section
    if (data.full_name && data.email && data.phone_number) completedSections++;
    
    // Bio & Specialties
    if (data.bio && data.specialty) completedSections++;
    
    // Education & Experience
    const hasValidEducation = Array.isArray(data.education) && data.education.some(
      edu => edu.university && edu.degree && edu.period
    );
    
    const hasValidExperience = Array.isArray(data.experience) && data.experience.some(
      exp => exp.company && exp.position && exp.period
    );
    
    if (hasValidEducation) completedSections++;
    if (hasValidExperience) completedSections++;
    
    // Location and Languages
    if (data.location && data.languages.length > 0) completedSections++;
    
    // Credentials
    if (data.credentials) completedSections++;
    
    // Availability & Pricing
    if (data.availability_status) completedSections++;
    
    return Math.round((completedSections / totalSections) * 100);
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
            <ProfileCompletion profile={profile} />
            
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
                      
                        {/* Name */}
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Dr. Jane Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Email */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@example.com" {...field} />
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
                      <Button type="button" onClick={() => setActiveTab("professional")}>
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
                              "Depression", "Anxiety", "Trauma", "PTSD", "Stress", 
                              "Grief", "Relationships", "Family Issues", "Self-Esteem",
                              "Addiction", "Youth Counseling", "Crisis Intervention"
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
                      <Button type="button" onClick={() => setActiveTab("education")}>
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
                      <Button type="button" onClick={() => setActiveTab("services")}>
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
                      <Button type="button" variant="outline" onClick={() => navigate('/mood-mentor-dashboard')}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
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