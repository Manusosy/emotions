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
  ChevronLeft,
  X,
  Book
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
import { api } from "@/lib/api";

// Global variable to track if dialog was shown in this session
let welcomeDialogShownInSession = false;

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
  welcome_dialog_shown?: boolean;
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

// Utility function for handling API errors consistently
const handleApiError = (error: any, component: string, defaultValue: any = null) => {
  // Check if it's a network error (failed to fetch)
  if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
    toast.error(`Network error while loading ${component}. Please check your connection.`);
    errorLog(`Network error in ${component}:`, error);
  } else {
    toast.error(`Error loading ${component}`);
    errorLog(`Error in ${component}:`, error);
  }
  
  // Return the default value for the component
  return defaultValue;
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
  const [dialogStatusChecked, setDialogStatusChecked] = useState(false);
  
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
        handleApiError(error, 'calendar appointments', []);
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
        handleApiError(error, 'appointments', getMockAppointments());
        // Use mock data as fallback (already set in handleApiError)
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
  
  // Simple function to check if welcome dialog should be shown
  useEffect(() => {
    if (!user || welcomeDialogShownInSession) return;
    
    // Check localStorage first
    try {
      const wasShown = localStorage.getItem(`welcome_dialog_shown_${user.id}`) === 'true';
      if (wasShown) {
        setShowWelcomeDialog(false);
        return;
      }
    } catch (err) {
      // Ignore localStorage errors
    }
    
    // Show dialog - hasn't been shown yet according to localStorage
    setShowWelcomeDialog(true);
  }, [user]);
  
  // Simple function to handle dialog close
  const handleCloseWelcomeDialog = () => {
    setShowWelcomeDialog(false);
    welcomeDialogShownInSession = true;
    
    // Save to localStorage
    if (user?.id) {
      try {
        localStorage.setItem(`welcome_dialog_shown_${user.id}`, 'true');
      } catch (err) {
        // Ignore localStorage errors
      }
      
      // Also save to database
      moodMentorService.updateMentorProfile(user.id, {
        welcome_dialog_shown: true
      }).catch(err => {
        errorLog("Error saving welcome dialog status:", err);
      });
    }
  };
  
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
        handleApiError(error, 'dashboard statistics', stats);
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
        handleApiError(error, 'recent activities', getMockActivities());
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

  // Add new state for weekly metrics
  const [weeklyMetrics, setWeeklyMetrics] = useState({
    newPatients: 0,
    sessionsCompleted: 0,
    cancellations: 0,
    patientRetention: 0
  });

  // Add new function to fetch weekly metrics
  useEffect(() => {
    const fetchWeeklyMetrics = async () => {
      if (!user) return;
      
      try {
        const response = await api.get(`/api/mood-mentors/${user.id}/weekly-metrics`);
        
        if (!response.ok) {
          throw new Error("Failed to get weekly metrics");
        }
        
        const data = await response.json();
        
        setWeeklyMetrics({
          newPatients: data.newPatients || 0,
          sessionsCompleted: data.sessionsCompleted || 0,
          cancellations: data.cancellations || 0,
          patientRetention: data.patientRetention || 0
        });
      } catch (error) {
        handleApiError(error, 'weekly metrics', weeklyMetrics);
      }
    };
    
    fetchWeeklyMetrics();
  }, [user]);

  // Add state for follow-ups
  const [followUps, setFollowUps] = useState([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);

  // Add function to fetch follow-ups
  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!user) return;
      
      setFollowUpsLoading(true);
      try {
        const response = await api.get(`/api/mood-mentors/${user.id}/follow-ups`);
        
        if (!response.ok) {
          throw new Error("Failed to get follow-ups");
        }
        
        const data = await response.json();
        setFollowUps(data);
      } catch (error) {
        handleApiError(error, 'follow-ups', []);
      } finally {
        setFollowUpsLoading(false);
      }
    };
    
    fetchFollowUps();
  }, [user]);

  // Add states for professional development and support groups
  const [professionalDevelopment, setProfessionalDevelopment] = useState([]);
  const [supportGroups, setSupportGroups] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // Add function to fetch professional development courses
  useEffect(() => {
    const fetchResources = async () => {
      if (!user) return;
      
      setResourcesLoading(true);
      try {
        // Fetch professional development courses
        const coursesResponse = await api.get('/api/resources/professional-development');
        
        if (!coursesResponse.ok) {
          throw new Error("Failed to get professional development courses");
        }
        
        const coursesData = await coursesResponse.json();
        setProfessionalDevelopment(coursesData);
        
        // Fetch support groups
        const groupsResponse = await api.get(`/api/mood-mentors/${user.id}/support-groups`);
        
        if (!groupsResponse.ok) {
          throw new Error("Failed to get support groups");
        }
        
        const groupsData = await groupsResponse.json();
        setSupportGroups(groupsData);
      } catch (error) {
        handleApiError(error, 'resources');
        // Set default empty arrays if there's an error
        setProfessionalDevelopment([]);
        setSupportGroups([]);
      } finally {
        setResourcesLoading(false);
      }
    };
    
    fetchResources();
  }, [user]);

  // Add state for professional resources
  const [professionalResources, setProfessionalResources] = useState([]);
  const [profResourcesLoading, setProfResourcesLoading] = useState(true);

  // Add function to fetch professional resources
  useEffect(() => {
    const fetchProfessionalResources = async () => {
      if (!user) return;
      
      setProfResourcesLoading(true);
      try {
        const response = await api.get('/api/resources/professional');
        
        if (!response.ok) {
          throw new Error("Failed to get professional resources");
        }
        
        const data = await response.json();
        setProfessionalResources(data);
      } catch (error) {
        handleApiError(error, 'professional resources', []);
      } finally {
        setProfResourcesLoading(false);
      }
    };
    
    fetchProfessionalResources();
  }, [user]);

  return (
    <DashboardLayout>
      {/* Welcome Dialog for new mood mentors */}
      <Dialog 
        open={showWelcomeDialog} 
        onOpenChange={(open) => {
          if (!open) handleCloseWelcomeDialog();
        }}
      >
        <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl p-0 overflow-hidden">
          {/* New modern design */}
          <div className="relative w-full">
            {/* Close button */}
            <div 
              className="absolute top-4 right-4 z-10 cursor-pointer rounded-full p-1 hover:bg-gray-100 transition-colors"
              onClick={handleCloseWelcomeDialog}
            >
              <X className="h-5 w-5 text-gray-500" />
            </div>
            
            {/* Header */}
            <motion.div 
              className="w-full px-8 pt-12 pb-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold tracking-tight">
                Hello <span className="text-[#00B3FE]">{profile?.full_name?.split(' ')[0] || 'Mood Mentor'}</span>, 
                <br />Welcome to <span className="text-[#00B3FE]">Emotions!</span>
              </h2>
              <p className="text-gray-600 mt-4 max-w-md mx-auto">
                We're excited to have you join our mental health community
              </p>
            </motion.div>
            
            {/* Content */}
            <div className="px-8 pb-8">
              {/* Complete Profile */}
              <motion.div 
                className="mb-8 border-b border-gray-100 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="text-[#00B3FE] mt-1 mr-4">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Complete Your Profile</h4>
                      <p className="text-gray-600 mt-1">Add your professional information</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      handleCloseWelcomeDialog();
                      navigate('/mood-mentor-dashboard/profile/edit');
                    }}
                    className="bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white rounded-full px-6"
                  >
                    Set Up Profile
                  </Button>
                </div>
              </motion.div>
              
              {/* Set Availability */}
              <motion.div 
                className="mb-8 border-b border-gray-100 pb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="text-green-500 mt-1 mr-4">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Set Your Availability</h4>
                      <p className="text-gray-600 mt-1">Define when you're available</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleCloseWelcomeDialog();
                      navigate('/mood-mentor-dashboard/availability');
                    }}
                    className="border-green-500 text-green-500 rounded-full px-6"
                  >
                    Set Hours
                  </Button>
                </div>
              </motion.div>
              
              {/* Connect With Patients */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="text-purple-500 mt-1 mr-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Connect With Patients</h4>
                      <p className="text-gray-600 mt-1">Start providing support</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleCloseWelcomeDialog();
                    }}
                    className="border-purple-500 text-purple-500 rounded-full px-6"
                  >
                    Explore
                  </Button>
                </div>
              </motion.div>
            </div>
            
            {/* Footer */}
            <motion.div 
              className="px-8 py-6 bg-gray-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Button 
                onClick={handleCloseWelcomeDialog}
                className="w-full bg-[#00B3FE] hover:bg-[#00B3FE]/90 text-white rounded-full py-3 font-medium"
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getTimeBasedGreeting()}</h1>
            <p className="text-sm text-gray-600 mt-1">{getRandomPositiveMessage()}</p>
          </div>
          
          {/* Quick CTA Button for profile improvement if needed */}
          {profileCompletionPercentage < 80 && (
            <Button 
              onClick={() => navigate('/mood-mentor-dashboard/profile/edit')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Complete Your Profile ({profileCompletionPercentage}%)
            </Button>
          )}
        </div>

        {/* Main KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Patients Card */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">Active Patients</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  {stats[0].trend || "Total"}
                </span>
              </div>
              <div className="text-3xl font-bold">{stats[0].value}</div>
              <p className="text-xs text-slate-500 mt-2">
                People under your guidance
              </p>
            </CardContent>
          </Card>

          {/* Upcoming Sessions Card */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="text-sm font-medium">Scheduled Sessions</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">
                  Upcoming
                </span>
              </div>
              <div className="text-3xl font-bold">{stats[1].value}</div>
              <p className="text-xs text-slate-500 mt-2">
                Sessions in your calendar
              </p>
            </CardContent>
          </Card>
          
          {/* Patient Satisfaction Card */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-fuchsia-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-sm font-medium">Satisfaction Rating</span>
                </div>
                {stats[3].trend && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                    {stats[3].trend}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold">{stats[3].value}</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 my-2">
                <div 
                  className="h-1.5 rounded-full bg-purple-500"
                  style={{ width: stats[3].value }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">
                Based on patient feedback
              </p>
            </CardContent>
          </Card>
          
          {/* Support Groups Card */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-amber-500 mr-2" />
                  <span className="text-sm font-medium">Support Groups</span>
                </div>
                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="text-3xl font-bold">{stats[2].value}</div>
              <p className="text-xs text-slate-500 mt-2">
                Community sessions you lead
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule & Patient Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule - 2/3 width */}
          <Card className="col-span-1 lg:col-span-2 bg-white border shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-white border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600" asChild>
                  <Link to="/mood-mentor-dashboard/appointments">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
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
              ) : appointments.length > 0 ? (
                <div className="space-y-4">
                  {/* Filter for today's appointments */}
                  {appointments
                    .filter(appointment => {
                      const appointmentDate = new Date(appointment.date);
                      const today = new Date();
                      return (
                        appointmentDate.getDate() === today.getDate() &&
                        appointmentDate.getMonth() === today.getMonth() &&
                        appointmentDate.getFullYear() === today.getFullYear()
                      );
                    })
                    .slice(0, 3)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center space-x-3 p-3 rounded-md border border-gray-100 bg-white hover:bg-blue-50/30 transition-colors">
                        <div className="flex flex-col items-center justify-center bg-blue-100 text-blue-800 rounded-lg p-2 min-w-14 text-center">
                          <span className="text-sm font-medium">{appointment.time.split(' ')[0]}</span>
                          <span className="text-xs">{appointment.time.split(' ')[1]}</span>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {appointment.patient_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{appointment.patient_name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            {getAppointmentBadge(appointment.type)}
                            <span className="mx-1">•</span>
                            <span>{format(new Date(appointment.date), "MMM d")}</span>
                          </div>
                        </div>
                        <div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3">
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {appointments.some(appointment => {
                    const appointmentDate = new Date(appointment.date);
                    const today = new Date();
                    return (
                      appointmentDate.getDate() === today.getDate() &&
                      appointmentDate.getMonth() === today.getMonth() &&
                      appointmentDate.getFullYear() === today.getFullYear()
                    );
                  }) ? (
                    <div className="pt-2 text-center">
                      <Button variant="outline" className="w-full text-sm h-8" asChild>
                        <Link to="/mood-mentor-dashboard/appointments">
                          View full schedule
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                      <Calendar className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-gray-700 font-medium mb-1">No appointments for today</h3>
                      <p className="text-gray-500 text-sm mb-4">Your schedule is clear for the rest of the day</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                  <Calendar className="h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-gray-700 font-medium mb-1">No upcoming appointments</h3>
                  <p className="text-gray-500 text-sm mb-4">Your schedule appears to be empty</p>
                  <Button variant="outline" className="text-sm" asChild>
                    <Link to="/mood-mentor-dashboard/availability">
                      Update availability
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weekly Patient Metrics - 1/3 width */}
          <Card className="bg-white border shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-white border-b">
              <CardTitle className="text-lg font-semibold">Weekly Patient Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* New Patients */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">New Patients</span>
                    <span className="font-medium">{weeklyMetrics.newPatients}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(weeklyMetrics.newPatients * 15, 100)}%` }}></div>
                  </div>
                </div>
                
                {/* Sessions Completed */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sessions Completed</span>
                    <span className="font-medium">{weeklyMetrics.sessionsCompleted}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(weeklyMetrics.sessionsCompleted * 6, 100)}%` }}></div>
                  </div>
                </div>
                
                {/* No-shows */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cancellations</span>
                    <span className="font-medium">{weeklyMetrics.cancellations}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.min(weeklyMetrics.cancellations * 20, 100)}%` }}></div>
                  </div>
                </div>
                
                {/* Patient Retention */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Patient Retention</span>
                    <span className="font-medium">{weeklyMetrics.patientRetention}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${weeklyMetrics.patientRetention}%` }}></div>
                  </div>
                </div>
                
                {/* Follow-ups Needed Section */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-amber-500" />
                    Follow-ups Needed
                  </h4>
                  {followUpsLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ) : followUps.length > 0 ? (
                    <div className="space-y-2">
                      {followUps.map((followUp, index) => (
                        <div 
                          key={index} 
                          className={`text-xs p-2 ${
                            followUp.type === 'missed' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          } rounded border`}
                        >
                          <p className="font-medium">{followUp.patientName}</p>
                          <p>{followUp.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs p-3 bg-gray-50 text-gray-600 rounded border border-gray-100 text-center">
                      No follow-ups needed at this time
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activities and Resources Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card className="bg-white border shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-white border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {activitiesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                      <div className={`${activity.iconBgClass} p-2 rounded-lg flex-shrink-0`}>
                        <div className={activity.iconColorClass}>{activity.icon}</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{activity.title}</h4>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-gray-700 font-medium mb-1">No recent activities</h3>
                  <p className="text-gray-500 text-sm">Your activity feed will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Professional Resources */}
          <Card className="bg-white border shadow-sm overflow-hidden">
            <CardHeader className="p-4 bg-white border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">Professional Resources</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {profResourcesLoading ? (
                <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 border border-gray-100 rounded-md bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-md bg-gray-200"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                    </div>
                  ))}
                </div>
              ) : professionalResources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professionalResources.map((resource, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border border-${resource.colorScheme}-100 rounded-md bg-${resource.colorScheme}-50 hover:bg-${resource.colorScheme}-100 transition-colors cursor-pointer`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 bg-${resource.colorScheme}-500 text-white rounded-md`}>
                          {resource.icon === 'book' && <Book className="h-4 w-4" />}
                          {resource.icon === 'users' && <Users className="h-4 w-4" />}
                          {resource.icon === 'chart' && <BarChart3 className="h-4 w-4" />}
                          {resource.icon === 'message' && <MessageSquare className="h-4 w-4" />}
                        </div>
                        <h4 className="font-medium text-sm">{resource.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600">{resource.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Book className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-gray-700 font-medium mb-1">No resources available</h3>
                  <p className="text-gray-500 text-sm">Professional resources will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Professional Development and Community Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Development */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <Book className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="font-medium">Professional Development</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Continue learning and enhance your therapeutic skills with our specialized courses and resources.
              </p>
              {resourcesLoading ? (
                <div className="animate-pulse bg-white/80 rounded-md p-3 mb-3 shadow-sm">
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : professionalDevelopment.length > 0 ? (
                <div className="bg-white rounded-md p-3 mb-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{professionalDevelopment[0].title}</h4>
                      <p className="text-xs text-gray-500">{professionalDevelopment[0].duration} • {professionalDevelopment[0].type}</p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                      {professionalDevelopment[0].badge}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-md p-3 mb-3 shadow-sm">
                  <div className="text-center text-gray-500 text-sm">
                    No courses available at this time
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full mt-2 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                Browse More Courses
              </Button>
            </CardContent>
          </Card>
          
          {/* Community Engagement */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-medium">Community Support Groups</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Lead and participate in community support groups to extend your reach and impact.
              </p>
              {resourcesLoading ? (
                <div className="animate-pulse bg-white/80 rounded-md p-3 mb-3 shadow-sm">
                  <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : supportGroups.length > 0 ? (
                <div className="bg-white rounded-md p-3 mb-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{supportGroups[0].name}</h4>
                      <p className="text-xs text-gray-500">{supportGroups[0].schedule} • {supportGroups[0].participants} participants</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                      {supportGroups[0].status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-md p-3 mb-3 shadow-sm">
                  <div className="text-center text-gray-500 text-sm">
                    No support groups available
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full mt-2 border-purple-200 text-purple-700 hover:bg-purple-100">
                Manage Support Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MoodMentorDashboard;
