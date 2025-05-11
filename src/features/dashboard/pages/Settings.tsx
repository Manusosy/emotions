import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { getDeviceInfo } from '@/utils/device-detection';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { errorLog, devLog } from '@/utils/environment';

// Define the schema for patient profile form
const patientFormSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone_number: z.string().min(10, 'Please enter a valid phone number'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say'], {
    required_error: "Please select a gender",
  }),
  date_of_birth: z.string().optional(),
  country: z.string().min(1, 'Please select your country'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  avatar_url: z.string().optional(),
  about_me: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

// Define the patient profile type
interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  country: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  avatar_url: string;
  about_me: string;
  created_at: string;
  updated_at: string;
  patient_id?: string;
}

// Define gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
];

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasUpdatedDeviceInfo, setHasUpdatedDeviceInfo] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-load form data with empty values to reduce flickering
  const defaultValues: PatientFormValues = {
    first_name: '',
    last_name: '',
    phone_number: '',
    gender: 'prefer-not-to-say',
    date_of_birth: '',
    country: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    avatar_url: '',
    about_me: '',
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
    mode: 'onSubmit'
  });

  // Load user profile data
  useEffect(() => {
    const loadPatientProfile = async () => {
      if (hasInitialized || !user?.id) return;
      
      try {
        // Set default values to prevent form field flickering
        Object.keys(defaultValues).forEach(key => {
          setValue(key as keyof PatientFormValues, defaultValues[key as keyof PatientFormValues]);
        });
        
        devLog("Loading patient profile for user:", user.id);
        
        // Load profile data
        const response = await api.get(`/api/patients/${user.id}/profile`);
        
        if (!response.ok) {
          throw new Error(`Failed to load profile: ${response.statusText}`);
        }
        
        const profileData = await response.json();
        
        if (profileData) {
          devLog("Profile data loaded successfully");
          // Update form with profile data
          Object.keys(profileData).forEach(key => {
            if (key in defaultValues) {
              setValue(key as keyof PatientFormValues, profileData[key]);
            }
          });
        }
        
        setHasInitialized(true);
      } catch (error) {
        errorLog('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadPatientProfile();
    } else {
      const timer = setTimeout(() => {
        if (user?.id && !hasInitialized) {
          loadPatientProfile();
        } else {
          setLoading(false);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user, setValue, hasInitialized, defaultValues]);

  // Update device information
  useEffect(() => {
    const updateDeviceInfo = async () => {
      if (hasUpdatedDeviceInfo || !user?.id) return;
      
      const deviceInfo = getDeviceInfo();
      setCurrentDeviceInfo(`${deviceInfo.os} • ${deviceInfo.deviceType} • ${deviceInfo.browser}`);
      setHasUpdatedDeviceInfo(true);
      
      try {
        devLog("Updating device info for user:", user.id);
        
        const response = await api.post('/api/users/device-info', {
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          last_login: new Date().toISOString(),
          user_agent: deviceInfo.fullUserAgent
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update device info: ${response.statusText}`);
        }
      } catch (error) {
        errorLog('Error updating device info:', error);
        // Non-critical error, don't show to user
      }
    };
    
    if (!loading && user?.id) {
      updateDeviceInfo();
    }
  }, [user, hasUpdatedDeviceInfo, loading]);

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      devLog("Uploading avatar file:", file.name);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/api/users/avatar', formData);
      
      if (!response.ok) {
        throw new Error(`Failed to upload avatar: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.avatar_url) {
        setValue('avatar_url', data.avatar_url);
        toast.success('Avatar updated successfully');
      }
    } catch (error) {
      errorLog('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: PatientFormValues) => {
    try {
      setSaveSuccess(false);
      setSaveError(false);
      
      devLog("Submitting profile update for user:", user?.id);

      const response = await api.put(`/api/patients/${user?.id}/profile`, data);
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (result) {
        setSaveSuccess(true);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      errorLog('Error updating profile:', error);
      setSaveError(true);
      toast.error('Failed to update profile');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      devLog("Attempting to delete account for user:", user?.id);
      
      const response = await api.delete('/api/account');
      
      if (!response.ok) {
        throw new Error(`Failed to delete account: ${response.statusText}`);
      }
      
      navigate('/auth/signup');
      toast.success('Account deleted successfully');
    } catch (error) {
      errorLog('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {saveSuccess && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">
            Changes saved successfully
          </div>
        )}
        
        {saveError && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            There was an error saving your changes. Please try again.
          </div>
        )}
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Card className="shadow-md border-none rounded-xl">
                <CardHeader className="border-b">
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Avatar upload */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={watch('avatar_url')} />
                        <AvatarFallback>
                          {watch('first_name')?.[0]}{watch('last_name')?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button
                          variant="outline"
                          className="relative"
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Change Avatar'}
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleAvatarUpload}
                            accept="image/*"
                          />
                        </Button>
                      </div>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          {...register('first_name')}
                          className="mt-1"
                        />
                        {errors.first_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          {...register('last_name')}
                          className="mt-1"
                        />
                        {errors.last_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact information */}
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        {...register('phone_number')}
                        className="mt-1"
                      />
                      {errors.phone_number && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>
                      )}
                    </div>

                    {/* Gender selection */}
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={watch('gender')}
                        onValueChange={(value) => setValue('gender', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                      )}
                    </div>

                    {/* Location information */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...register('country')}
                          className="mt-1"
                        />
                        {errors.country && (
                          <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...register('city')}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            {...register('state')}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          {...register('address')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          {...register('pincode')}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* About me */}
                    <div>
                      <Label htmlFor="about_me">About Me</Label>
                      <Textarea
                        id="about_me"
                        {...register('about_me')}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="account">
            <Card className="shadow-md border-none rounded-xl">
              <CardHeader className="border-b">
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Email settings */}
                  <div>
                    <h4 className="font-medium mb-2">Email Address</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      Your email address is <strong>{user?.email}</strong>
                    </p>
                    <Button variant="outline">
                      Change Email
                    </Button>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Password settings */}
                  <div>
                    <h4 className="font-medium mb-2">Password</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      Change your password to keep your account secure
                    </p>
                    <Button variant="outline">
                      Change Password
                    </Button>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Device information */}
                  <div>
                    <h4 className="font-medium mb-2">Current Device</h4>
                    <p className="text-sm text-slate-500">
                      {currentDeviceInfo}
                    </p>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Delete account */}
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Delete Account</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-md border-none rounded-xl">
              <CardHeader className="border-b">
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-500">Receive email about your account activity</p>
                    </div>
                    <div>
                      <input type="checkbox" id="email-notifications" className="mr-2" defaultChecked />
                      <Label htmlFor="email-notifications" className="inline-block">Enable</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Appointment Reminders</h4>
                      <p className="text-sm text-slate-500">Get notified about upcoming appointments</p>
                    </div>
                    <div>
                      <input type="checkbox" id="appointment-notifications" className="mr-2" defaultChecked />
                      <Label htmlFor="appointment-notifications" className="inline-block">Enable</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Mood Tracking Reminders</h4>
                      <p className="text-sm text-slate-500">Receive reminders to track your mood</p>
                    </div>
                    <div>
                      <input type="checkbox" id="mood-tracking-notifications" className="mr-2" defaultChecked />
                      <Label htmlFor="mood-tracking-notifications" className="inline-block">Enable</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Communications</h4>
                      <p className="text-sm text-slate-500">Receive updates about new features and promotions</p>
                    </div>
                    <div>
                      <input type="checkbox" id="marketing-notifications" className="mr-2" />
                      <Label htmlFor="marketing-notifications" className="inline-block">Enable</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 