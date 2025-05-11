import { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Lock,
  BellRing,
  Calendar,
  PaintBucket,
  ShieldAlert,
  LinkIcon,
  User,
  Info,
  Mail
} from "lucide-react";

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  
  // Account Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(true);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Appointment settings
  const [defaultSessionDuration, setDefaultSessionDuration] = useState("60");
  const [bufferTime, setBufferTime] = useState("15");
  const [autoAcceptAppointments, setAutoAcceptAppointments] = useState(false);
  
  // Appearance settings
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [dataSharing, setDataSharing] = useState(true);
  
  const handleSaveSettings = (section: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${section} settings saved successfully`);
    }, 800);
  };
  
  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account preferences and application settings</p>
          </div>
        </div>
        
        <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Account & Security</span>
              <span className="sm:hidden">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Appointments</span>
              <span className="sm:hidden">Appts</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <PaintBucket className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Look</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy & Data</span>
              <span className="sm:hidden">Privacy</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Account & Security */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings and login preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      placeholder="youremail@example.com"
                      defaultValue={user?.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500">
                      Contact support to change your primary email address
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Two-factor Authentication</Label>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="login-notifications">Login Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive an email when a new login is detected
                      </p>
                    </div>
                    <Switch
                      id="login-notifications"
                      checked={loginNotificationsEnabled}
                      onCheckedChange={setLoginNotificationsEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Change Password
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  onClick={() => handleSaveSettings("Account security")}
                  disabled={isLoading}
                  className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="app-notifications">In-App Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications within the Emotions app
                      </p>
                    </div>
                    <Switch
                      id="app-notifications"
                      checked={appNotifications}
                      onCheckedChange={setAppNotifications}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                      <p className="text-sm text-gray-500">
                        Get notified about upcoming appointments
                      </p>
                    </div>
                    <Switch
                      id="appointment-reminders"
                      checked={appointmentReminders}
                      onCheckedChange={setAppointmentReminders}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-gray-500">
                        Receive updates, tips, and promotional content
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  onClick={() => handleSaveSettings("Notification")}
                  disabled={isLoading}
                  className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appointments */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Settings</CardTitle>
                <CardDescription>
                  Configure your default appointment preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-duration">Default Session Duration</Label>
                    <Select value={defaultSessionDuration} onValueChange={setDefaultSessionDuration}>
                      <SelectTrigger id="session-duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="buffer-time">Buffer Time Between Sessions</Label>
                    <Select value={bufferTime} onValueChange={setBufferTime}>
                      <SelectTrigger id="buffer-time">
                        <SelectValue placeholder="Select buffer time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No buffer</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-accept">Auto-Accept Appointments</Label>
                    <p className="text-sm text-gray-500">
                      Automatically accept appointment requests that fit your availability
                    </p>
                  </div>
                  <Switch
                    id="auto-accept"
                    checked={autoAcceptAppointments}
                    onCheckedChange={setAutoAcceptAppointments}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  onClick={() => handleSaveSettings("Appointment")}
                  disabled={isLoading}
                  className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select value={fontSize} onValueChange={setFontSize}>
                      <SelectTrigger id="font-size">
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Accessibility Tip</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        Larger font sizes and high contrast themes can improve readability. Choose settings that work best for your needs.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  onClick={() => handleSaveSettings("Appearance")}
                  disabled={isLoading}
                  className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Privacy & Data */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data Settings</CardTitle>
                <CardDescription>
                  Control your privacy settings and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-visibility">Profile Visibility</Label>
                    <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                      <SelectTrigger id="profile-visibility">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Visible to everyone</SelectItem>
                        <SelectItem value="patients">Patients Only - Only your patients can view</SelectItem>
                        <SelectItem value="private">Private - Only visible to you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="data-sharing">Data Sharing for Platform Improvement</Label>
                      <p className="text-sm text-gray-500">
                        Allow anonymous usage data to improve the platform
                      </p>
                    </div>
                    <Switch
                      id="data-sharing"
                      checked={dataSharing}
                      onCheckedChange={setDataSharing}
                    />
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex gap-2">
                      <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-700">Privacy Notice</h4>
                        <p className="text-sm text-amber-600 mt-1">
                          We respect your privacy and only collect data that helps us improve your experience. You can request a copy of your data or delete your account at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => navigate('/mood-mentor-dashboard/settings/delete-account')}>
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  onClick={() => handleSaveSettings("Privacy")}
                  disabled={isLoading}
                  className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage; 