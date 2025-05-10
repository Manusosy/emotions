import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { errorLog } from "@/utils/environment";
import { 
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Home,
  Building2,
  BadgeHelp,
  Clock,
  Shield,
  Edit,
  Pencil,
  Users,
  FileText,
  Bell,
  Key
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { UserProfile } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        
        if (!user) {
          return;
        }

        // Fetch profile data from API
        const response = await api.get(`/api/patients/${user.id}/profile`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const profileData = await response.json();
        setProfile(profileData);
      } catch (error) {
        errorLog('Error fetching profile:', error);
        
        // Fallback to creating profile from user metadata if API fails
        if (user) {
        const userProfile: UserProfile = {
          id: user.id,
          patient_id: user.user_metadata?.patient_id || 'EMHA01P',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          phone_number: user.user_metadata?.phone_number || '',
          date_of_birth: user.user_metadata?.date_of_birth || '',
          gender: user.user_metadata?.gender || '',
          country: user.user_metadata?.country || '',
          address: user.user_metadata?.address || '',
          city: user.user_metadata?.city || '',
          state: user.user_metadata?.state || '',
          pincode: user.user_metadata?.pincode || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: user.created_at || new Date().toISOString()
        };

        setProfile(userProfile);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground mt-1">View and manage your personal information</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/patient-dashboard/appointments')}
              className="border-blue-200 text-blue-600"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
            <Button 
              onClick={() => navigate('/patient-dashboard/settings')}
              className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
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
              <div className="bg-gradient-to-r from-[#20C0F3]/90 to-[#20C0F3]/70 h-32 relative">
                <div className="absolute -bottom-16 left-8">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-[#20C0F3] text-white text-2xl">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <CardContent className="pt-20 pb-6 px-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-[#20C0F3]/10 border-[#20C0F3]/20 text-[#20C0F3] font-medium">
                        <BadgeHelp className="h-3.5 w-3.5 mr-1" />
                        {profile.patient_id}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-[#20C0F3]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  
                  {profile.phone_number && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-[#20C0F3]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone_number}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.date_of_birth && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                        <Calendar className="h-5 w-5 text-[#20C0F3]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {format(new Date(profile.date_of_birth), 'PP')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {profile.gender && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                        <User className="h-5 w-5 text-[#20C0F3]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium capitalize">{profile.gender}</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.country && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                        <MapPin className="h-5 w-5 text-[#20C0F3]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Country</p>
                        <p className="font-medium">{profile.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for various profile sections */}
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="personal" className="rounded-md data-[state=active]:bg-white">
                  <User className="h-4 w-4 mr-2" />
                  Personal Details
                </TabsTrigger>
                <TabsTrigger value="address" className="rounded-md data-[state=active]:bg-white">
                  <Home className="h-4 w-4 mr-2" />
                  Address
                </TabsTrigger>
                <TabsTrigger value="account" className="rounded-md data-[state=active]:bg-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="privacy" className="rounded-md data-[state=active]:bg-white">
                  <Key className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              {/* Personal Details Tab */}
              <TabsContent value="personal">
                <Card className="shadow-md border-none rounded-xl">
                  <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2 text-[#20C0F3]" />
                        Personal Information
                      </CardTitle>
                      <Button 
                        size="sm"
                        variant="ghost" 
                        onClick={() => navigate('/patient-dashboard/settings')}
                        className="text-[#20C0F3]"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Full Name</h3>
                        <p className="mt-1">{profile.first_name} {profile.last_name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Email</h3>
                        <p className="mt-1">{profile.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Phone</h3>
                        <p className="mt-1">{profile.phone_number || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Date of Birth</h3>
                        <p className="mt-1">
                          {profile.date_of_birth 
                            ? format(new Date(profile.date_of_birth), 'PPP') 
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Gender</h3>
                        <p className="mt-1 capitalize">{profile.gender || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500">Country</h3>
                        <p className="mt-1">{profile.country || "Not provided"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Address Tab */}
              <TabsContent value="address">
                <Card className="shadow-md border-none rounded-xl">
                  <CardHeader className="border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-[#20C0F3]" />
                        Address Information
                      </CardTitle>
                      <Button 
                        size="sm"
                        variant="ghost" 
                        onClick={() => navigate('/patient-dashboard/settings')}
                        className="text-[#20C0F3]"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-6">
                    {(profile.address || profile.city || profile.state || profile.pincode) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        {profile.address && (
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Street Address</h3>
                            <p className="mt-1">{profile.address}</p>
                          </div>
                        )}
                        {profile.city && (
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">City</h3>
                            <p className="mt-1">{profile.city}</p>
                          </div>
                        )}
                        {profile.state && (
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">State</h3>
                            <p className="mt-1">{profile.state}</p>
                          </div>
                        )}
                        {profile.pincode && (
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Pincode</h3>
                            <p className="mt-1">{profile.pincode}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <h3 className="text-lg font-medium mb-1">No address information</h3>
                        <p className="text-slate-500 mb-4 max-w-md mx-auto">
                          You haven't added your address information yet. Adding your address helps us provide better location-based services.
                        </p>
                        <Button 
                          onClick={() => navigate('/patient-dashboard/settings')}
                          className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
                        >
                          Add Address
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account">
                <Card className="shadow-md border-none rounded-xl">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-[#20C0F3]" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                        <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-[#20C0F3]" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">{format(new Date(profile.created_at), 'PPP')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Account Status</p>
                          <p className="font-medium">Active</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                        <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                          <BadgeHelp className="h-5 w-5 text-[#20C0F3]" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Patient ID</p>
                          <p className="font-medium">{profile.patient_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                        <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                          <Bell className="h-5 w-5 text-[#20C0F3]" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Notifications</p>
                          <p className="font-medium">Enabled</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy">
                <Card className="shadow-md border-none rounded-xl">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center">
                      <Key className="h-5 w-5 mr-2 text-[#20C0F3]" />
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Change Password</h3>
                          <p className="text-sm text-slate-500 mt-1">Update your account password for better security</p>
                        </div>
                        <Button 
                          onClick={() => navigate('/patient-dashboard/settings/password')}
                          className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
                        >
                          Change Password
                        </Button>
                      </div>
                      <div className="border-t pt-8">
                        <h3 className="font-medium mb-6">Data Privacy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                            <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                              <Shield className="h-5 w-5 text-[#20C0F3]" />
                        </div>
                        <div>
                              <p className="text-sm text-muted-foreground">Data Protection</p>
                              <p className="font-medium">Active</p>
                        </div>
                      </div>
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
                            <div className="bg-[#20C0F3]/10 p-2 rounded-full">
                              <FileText className="h-5 w-5 text-[#20C0F3]" />
                        </div>
                        <div>
                              <p className="text-sm text-muted-foreground">Privacy Policy</p>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 h-auto font-medium text-[#20C0F3]"
                                onClick={() => navigate('/privacy-policy')}
                              >
                                View Privacy Policy
                          </Button>
                        </div>
                      </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
