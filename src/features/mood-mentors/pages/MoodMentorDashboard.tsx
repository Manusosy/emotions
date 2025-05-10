import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Search, 
  BarChart3, 
  MessageSquare, 
  Bell, 
  ChevronRight,
  User,
  Clock,
  Video,
  Check,
  AlertCircle,
  Settings,
  LayoutDashboard,
  ChevronLeft
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, subDays, getDaysInMonth, startOfMonth, getDay, addMonths } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { profileService } from "@/lib/profileService";
import { moodMentorService } from "@/lib/moodMentorService";
import { errorLog, devLog } from "@/utils/environment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

// Define the structure for statistics cards
interface StatCard {
  title: string;
  value: number | string;
  trend?: string;
  icon: React.ReactNode;
}

// Define appointment interface
interface Appointment {
  id: string;
  patient_name: string;
  date: string;
  time: string;
  type: 'video' | 'in-person' | 'chat';
  status: 'upcoming' | 'canceled' | 'completed';
}

interface MoodMentorProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  avatar_url: string;
  specialties: string[];
  [key: string]: any;
}

// Define interface for recent activities
interface RecentActivity {
  id: string;
  title: string;
  time: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
}

// Interface for activity data from database
interface DbActivity {
  id: string;
  user_id: string;
  activity_type: 'message' | 'appointment' | 'group' | 'profile' | 'other';
  title: string;
  description?: string;
  created_at: string;
  metadata?: any;
}

// Mood Mentor service compatibility - uses the moodMentorService as a fallback
// This helps maintain backward compatibility with code that expects the older service naming
const moodMentorCompatibilityService = {
  getDashboardStats: (mentorId: string) => moodMentorService.getDashboardStats(mentorId),
  getRecentActivities: (mentorId: string, limit?: number) => moodMentorService.getRecentActivities(mentorId, limit)
};

const MoodMentorDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(0);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [profile, setProfile] = useState<MoodMentorProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: "Total Patients",
      value: 0,
      trend: "",
      icon: <Users className="h-5 w-5 text-blue-500" />
    },
    {
      title: "Upcoming Appointments",
      value: 0,
      icon: <Calendar className="h-5 w-5 text-purple-500" />
    },
    {
      title: "Support Groups",
      value: 0,
      icon: <Users className="h-5 w-5 text-amber-500" />
    },
    {
      title: "Patient Satisfaction",
      value: "0%",
      trend: "",
      icon: <BarChart3 className="h-5 w-5 text-green-500" />
    }
  ]);

  // Recent activities data - start with empty state
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointmentDates, setAppointmentDates] = useState<number[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  
  // Get calendar data
  const currentMonthName = format(currentDate, "MMMM yyyy");
  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getDay(startOfMonth(currentDate));
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Fetch calendar appointments
  useEffect(() => {
    const fetchCalendarAppointments = async () => {
      if (!user) return;
      
      setCalendarLoading(true);
      try {
        // Get the start and end of the current month
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
        // Fetch all appointments using moodMentorService
        const appointments = await moodMentorService.getAppointments(user.id);
        
        if (appointments && appointments.length > 0) {
          // Extract the days with appointments
          const daysWithAppointments = appointments.map(apt => {
            const date = new Date(apt.startTime);
            return date.getDate(); // Get day of month (1-31)
          });
          
          setAppointmentDates(daysWithAppointments);
        } else {
          // No appointments this month
          setAppointmentDates([]);
        }
      } catch (error) {
        errorLog('Error in calendar fetch:', error);
        setAppointmentDates([]);
      } finally {
        setCalendarLoading(false);
      }
    };
    
    fetchCalendarAppointments();
  }, [user, currentDate]);
  
  // Navigate to previous/next month
  const changeMonth = (increment: number) => {
    setCurrentDate(prevDate => addMonths(prevDate, increment));
  };
  
  // Helper function to determine if a day has appointments
  const hasDayAppointment = (day: number) => {
    return appointmentDates.includes(day);
  };
  
  // Fetch appointments from our API
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const appointments = await moodMentorService.getAppointments(user.id);
        setAppointments(appointments);
      } catch (error) {
        errorLog('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
        // Use mock data as fallback
        setAppointments(getMockAppointments());
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);
  
  // Helper function for mock appointments (as fallback)
  const getMockAppointments = (): Appointment[] => {
    return [
      {
        id: '1',
        patient_name: 'Emma Thompson',
        date: '2025-04-30',
        time: '10:00 AM',
        type: 'video',
        status: 'upcoming'
      },
      {
        id: '2',
        patient_name: 'James Wilson',
        date: '2025-05-02',
        time: '2:30 PM',
        type: 'in-person',
        status: 'upcoming'
      },
      {
        id: '3',
        patient_name: 'Sophia Garcia',
        date: '2025-05-03',
        time: '11:15 AM',
        type: 'video',
        status: 'upcoming'
      },
      {
        id: '4',
        patient_name: 'Olivia Miller',
        date: '2025-04-27',
        time: '3:00 PM',
        type: 'chat',
        status: 'upcoming'
      }
    ];
  };
  
  // Check if user is new
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) return;
      
      try {
        // Ensure the mood_mentor_profiles schema is up-to-date
        await profileService.ensureMoodMentorProfileSchema();
        
        // Get the profile
        const { data: profileData, error } = await profileService.getMoodMentorProfile(user.id);
        
        if (profileData) {
          setProfile(profileData);
          
          // Calculate profile completeness
          let completionPercentage = calculateProfileCompletion(profileData);
          setProfileCompletionPercentage(completionPercentage);
          
          // Check the welcome_dialog_shown field in the profile instead of localStorage
          if (!profileData.welcome_dialog_shown) {
            devLog("Showing welcome dialog - not seen before");
            setIsNewUser(true);
            setShowWelcomeDialog(true);
          }
        } else if (error && error.code !== 'PGRST116') {
          // If not a "record not found" error
          devLog("Error fetching profile:", error);
          toast.error("Failed to load your profile data");
          
          // Create a basic profile for new users and show welcome
          setIsNewUser(true);
          setShowWelcomeDialog(true);
        } else {
          // No profile found, this is a new user. Show welcome
          setIsNewUser(true);
          setShowWelcomeDialog(true);
        }
      } catch (error) {
        devLog("Error checking user status:", error);
      }
    };
    
    checkUserStatus();
  }, [user]);
  
  // Calculate profile completion percentage
  const calculateProfileCompletion = (profile: MoodMentorProfile) => {
    if (!profile) return 0;
    
    let completedSections = 0;
    let totalSections = 7; // Total number of important profile sections
    
    // Personal info section
    if (profile.full_name && profile.email) completedSections++;
    
    // Bio & Specialties
    if (profile.bio && profile.specialties?.length > 0) completedSections++;
    
    // Education & Experience
    if (
      profile.education?.length > 0 &&
      profile.experience?.length > 0
    ) completedSections++;
    
    // Therapy & Services
    if (profile.therapyTypes?.length > 0 && profile.specialty) completedSections++;
    
    // Availability & Pricing
    if (profile.availability_status) completedSections++;
    
    // Media
    if (profile.avatar_url) completedSections++;
    
    // Location and other info
    if (profile.location && profile.languages?.length > 0) completedSections++;
    
    return Math.round((completedSections / totalSections) * 100);
  };
  
  // Define day names for the calendar
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Helper function to determine badge color based on appointment type
  const getAppointmentBadge = (type: string) => {
    switch(type) {
      case 'video':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Video className="h-3 w-3 mr-1" />
            Video
          </Badge>
        );
      case 'in-person':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <User className="h-3 w-3 mr-1" />
            In-Person
          </Badge>
        );
      case 'chat':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Fetch dashboard statistics from Supabase using our service
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      
      try {
        // Use the ambassador service to get all dashboard stats
        const stats = await moodMentorService.getDashboardStats(user.id);
        
        // Update the stats state with real data
        const updatedStats = [
          {
            title: "Total Patients",
            value: stats.patientsCount,
            trend: stats.patientsCount > 0 ? "+12%" : "", // Placeholder trend
            icon: <Users className="h-5 w-5 text-blue-500" />
          },
          {
            title: "Upcoming Appointments",
            value: stats.appointmentsCount,
            icon: <Calendar className="h-5 w-5 text-purple-500" />
          },
          {
            title: "Support Groups",
            value: stats.groupsCount,
            icon: <Users className="h-5 w-5 text-amber-500" />
          },
          {
            title: "Patient Satisfaction",
            value: `${stats.ratingPercentage}%`,
            trend: stats.reviewsCount > 3 ? "+5%" : "",
            icon: <BarChart3 className="h-5 w-5 text-green-500" />
          }
        ];
        
        setStats(updatedStats);
      } catch (error) {
        devLog('Error fetching dashboard stats:', error);
        // Keep the default stats if there's an error
      }
    };
    
    fetchDashboardStats();
  }, [user]);

  // Replace the fetchRecentActivities function with this version using our service
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!user) return;
      
      setActivitiesLoading(true);
      try {
        // Use our ambassador service to get recent activities
        const { success, data, error } = await moodMentorService.getRecentActivities(user.id, 5);
        
        if (!success || error || !data || data.length === 0) {
          // Fall back to mock data if no activities found
          setRecentActivities(getMockActivities());
        } else {
          // Map database activities to UI activities
          const formattedActivities = data.map(activity => {
            // Determine icon and colors based on activity type
            let icon = <MessageSquare className="h-4 w-4" />;
            let iconBgClass = "bg-blue-100";
            let iconColorClass = "text-blue-600";
            
            switch(activity.activity_type) {
              case 'appointment':
                icon = <Calendar className="h-4 w-4" />;
                iconBgClass = "bg-green-100";
                iconColorClass = "text-green-600";
                break;
              case 'group':
                icon = <Users className="h-4 w-4" />;
                iconBgClass = "bg-amber-100";
                iconColorClass = "text-amber-600";
                break;
              case 'profile':
                icon = <User className="h-4 w-4" />;
                iconBgClass = "bg-purple-100";
                iconColorClass = "text-purple-600";
                break;
              // Default to message styling for other types
            }
            
            return {
              id: activity.id,
              title: activity.title,
              time: formatActivityTime(activity.created_at),
              icon,
              iconBgClass,
              iconColorClass
            };
          });
          
          setRecentActivities(formattedActivities);
        }
      } catch (error) {
        devLog('Error in activity fetch:', error);
        setRecentActivities(getMockActivities());
      } finally {
        setActivitiesLoading(false);
      }
    };
    
    fetchRecentActivities();
  }, [user]);
  
  // Helper for formatting activity time
  const formatActivityTime = (dateString: string) => {
    const activityDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${format(activityDate, "h:mm a")}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${format(activityDate, "h:mm a")}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return format(activityDate, "MMM d, yyyy");
    }
  };
  
  // Helper function for mock activities (as fallback)
  const getMockActivities = (): RecentActivity[] => {
    return [
      {
        id: "1",
        title: "Emma Thompson sent you a message",
        time: "Today, 9:30 AM",
        icon: <MessageSquare className="h-4 w-4" />,
        iconBgClass: "bg-blue-100",
        iconColorClass: "text-blue-600"
      },
      {
        id: "2",
        title: "Appointment with James Wilson completed",
        time: "Yesterday, 2:30 PM",
        icon: <Calendar className="h-4 w-4" />,
        iconBgClass: "bg-green-100",
        iconColorClass: "text-green-600"
      },
      {
        id: "3",
        title: "New member joined Anxiety Support group",
        time: "Yesterday, 11:29 AM",
        icon: <Users className="h-4 w-4" />,
        iconBgClass: "bg-amber-100",
        iconColorClass: "text-amber-600"
      },
      {
        id: "4",
        title: "Profile review completed - 95% complete",
        time: "2 days ago",
        icon: <User className="h-4 w-4" />,
        iconBgClass: "bg-purple-100",
        iconColorClass: "text-purple-600"
      },
      {
        id: "5",
        title: "Sophia Garcia requested appointment reschedule",
        time: "2 days ago",
        icon: <MessageSquare className="h-4 w-4" />,
        iconBgClass: "bg-blue-100",
        iconColorClass: "text-blue-600"
      }
    ];
  };

  // Function to handle closing the welcome dialog
  const handleCloseWelcomeDialog = () => {
    setShowWelcomeDialog(false);
    
    // Update the user's profile with welcome_dialog_shown flag instead of using localStorage
    if (user?.id) {
      profileService.updateMoodMentorProfile(user.id, {
        welcome_dialog_shown: true
      }).then(() => {
        devLog("Welcome dialog shown status saved to user profile");
      }).catch(err => {
        errorLog("Error saving welcome dialog status:", err);
      });
    }
  };

  // Get the appropriate greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hours = new Date().getHours();
    const firstName = profile?.full_name?.split(' ')[0] || 'Mood Mentor';
    
    if (hours < 12) {
      return `Good morning, ${firstName}`;
    } else if (hours < 18) {
      return `Good afternoon, ${firstName}`;
    } else {
      return `Good evening, ${firstName}`;
    }
  };

  // Random positive messages to show with the greeting
  const positiveMessages = [
    "We hope you're having a wonderful day!",
    "Thank you for making a difference in mental health support.",
    "Your dedication to helping others is inspiring.",
    "Today is a new opportunity to make a positive impact.",
    "Your expertise matters to those seeking support."
  ];

  // Get a random positive message
  const getRandomPositiveMessage = () => {
    const randomIndex = Math.floor(Math.random() * positiveMessages.length);
    return positiveMessages[randomIndex];
  };

  return (
    <DashboardLayout>
      {/* Welcome Dialog for new mood mentors */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#20C0F3]">
              Hello {profile?.full_name?.split(' ')[0] || 'Mood Mentor'}, Welcome to Emotions!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              We're excited to have you join our mental health community
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-2 rounded-full">
                <User className="h-5 w-5 text-[#20C0F3]" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">Complete Your Profile</h4>
                <p className="text-sm text-gray-600">Add your professional information to be visible to patients</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => {
                  handleCloseWelcomeDialog();
                  navigate('/mood-mentor-dashboard/settings');
                }}
                className="bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
              >
                Set Up Profile
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">Set Your Availability</h4>
                <p className="text-sm text-gray-600">Define when you're available for consultations</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  handleCloseWelcomeDialog();
                  navigate('/mood-mentor-dashboard/availability');
                }}
                className="border-green-200 text-green-600"
              >
                Set Hours
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">Connect With Patients</h4>
                <p className="text-sm text-gray-600">Start providing mental health support to those in need</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  handleCloseWelcomeDialog();
                }}
                className="border-purple-200 text-purple-600"
              >
                Explore
              </Button>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col gap-2">
            <Button 
              onClick={handleCloseWelcomeDialog}
              className="w-full bg-[#20C0F3] hover:bg-[#20C0F3]/90 text-white"
            >
              Get Started
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-5">
        {/* Greeting Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-blue-800">{getTimeBasedGreeting()}</h2>
                  <p className="text-sm text-blue-700 mt-1">
                    {getRandomPositiveMessage()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Completion Alert for incomplete profiles */}
        {profileCompletionPercentage < 80 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-blue-50 border-blue-200 mb-5">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-800">Complete your profile to attract more patients</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Your profile is {profileCompletionPercentage}% complete. Finish setting up your profile to become fully visible in search results.
                      </p>
                      <div className="mt-2">
                        <Progress value={profileCompletionPercentage} className="h-2 bg-blue-200" indicatorClassName="bg-blue-500" />
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 whitespace-nowrap"
                    onClick={() => navigate('/mood-mentor-dashboard/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    {stat.trend && (
                      <span className="text-xs font-medium text-emerald-600 mt-1 block">{stat.trend}</span>
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 rounded-full">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Upcoming Appointments */}
          <Card className="col-span-1 lg:col-span-2 bg-white border shadow-sm overflow-hidden">
            <CardHeader className="p-3 md:p-4 bg-white border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600" asChild>
                  <Link to="/mood-mentor-dashboard/appointments">
                    View Calendar <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 w-2/5 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {appointment.patient_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{appointment.patient_name}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{appointment.time}</span>
                          <span className="mx-1">•</span>
                          <span>{format(new Date(appointment.date), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <div>
                        {getAppointmentBadge(appointment.type)}
                      </div>
                      <div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3">
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-1 text-center">
                    <Button variant="outline" className="w-full text-sm h-8" asChild>
                      <Link to="/mood-mentor-dashboard/appointments">
                        View all appointments
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links & Calendar */}
          <div className="space-y-5">
            <Card className="bg-white border shadow-sm overflow-hidden">
              <CardHeader className="p-3 bg-white border-b">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3" asChild>
                    <Link to="/mood-mentor-dashboard/availability">
                      <Calendar className="h-4 w-4 mr-3 text-blue-500" />
                      <div>
                        <p className="font-medium">Set Availability</p>
                        <p className="text-xs text-gray-500">Define your schedule for bookings</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3" asChild>
                    <Link to="/mood-mentor-dashboard/settings">
                      <User className="h-4 w-4 mr-3 text-emerald-500" />
                      <div>
                        <p className="font-medium">Edit Profile</p>
                        <p className="text-xs text-gray-500">Update your professional details</p>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3" asChild>
                    <Link to="/mood-mentor-dashboard/messages">
                      <MessageSquare className="h-4 w-4 mr-3 text-purple-500" />
                      <div>
                        <p className="font-medium">Messages</p>
                        <p className="text-xs text-gray-500">View patient communications</p>
                      </div>
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-left h-auto py-2 px-3" asChild>
                    <Link to="/mood-mentor-dashboard/patients">
                      <Users className="h-4 w-4 mr-3 text-amber-500" />
                      <div>
                        <p className="font-medium">My Patients</p>
                        <p className="text-xs text-gray-500">View your patient list</p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Mini Calendar */}
            <Card className="bg-white border shadow-sm overflow-hidden">
              <CardHeader className="p-3 bg-white border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">{currentMonthName}</CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => changeMonth(-1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => changeMonth(1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {calendarLoading ? (
                  <div className="animate-pulse">
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {daysOfWeek.map(day => (
                        <div key={day} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                      {Array(35).fill(null).map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-200 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {daysOfWeek.map(day => (
                      <div key={day} className="py-1 font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    
                    {/* Empty cells for days before the first of the month */}
                    {Array(startDay).fill(null).map((_, i) => (
                      <div key={`empty-start-${i}`} className="aspect-square" />
                    ))}
                    
                    {/* Days of the month */}
                    {calendarDays.map(day => {
                      const hasAppointment = hasDayAppointment(day);
                      const isToday = day === new Date().getDate() && 
                                    currentDate.getMonth() === new Date().getMonth() && 
                                    currentDate.getFullYear() === new Date().getFullYear();
                      
                      return (
                        <div 
                          key={day} 
                          className={`aspect-square flex items-center justify-center rounded-full text-sm relative
                            ${hasAppointment ? 'font-medium text-blue-700' : 'text-gray-700'}
                            ${isToday ? 'bg-blue-100' : ''}
                            hover:bg-gray-100 cursor-pointer
                          `}
                        >
                          {day}
                          {hasAppointment && (
                            <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Empty cells for days after the last day of the month */}
                    {Array(42 - (startDay + daysInMonth)).fill(null).map((_, i) => (
                      <div key={`empty-end-${i}`} className="aspect-square" />
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-3 border-t">
                <Button variant="ghost" size="sm" className="w-full text-blue-600" asChild>
                  <Link to="/mood-mentor-dashboard/appointments">
                    Full Calendar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Recent Activities Section */}
        <Card className="bg-white border shadow-sm overflow-hidden">
          <CardHeader className="p-3 md:p-4 bg-white border-b">
            <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activitiesLoading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                // Real activity data
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <div className={`${activity.iconBgClass} p-2 rounded-lg`}>
                      <div className={activity.iconColorClass}>{activity.icon}</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MoodMentorDashboard;
