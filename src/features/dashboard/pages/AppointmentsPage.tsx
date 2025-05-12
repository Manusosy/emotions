import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare, 
  Filter, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone as PhoneIcon,
  CalendarClock,
  Star,
  Calendar,
  Info,
  FilterIcon,
  X,
  CalendarPlus,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, addDays, parse, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment } from "@/lib/appointmentService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { appointmentService } from "@/lib/appointmentService";
import { api } from "@/lib/api";
import { errorLog, devLog } from "@/utils/environment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { moodMentorService } from "@/lib/moodMentorService";

// Replace hardcoded ambassador profiles with a type
interface MoodMentorProfile {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  reviews: number;
  available: boolean;
  nextAvailable?: string;
  email?: string;
  phone?: string;
  bio?: string;
  education?: string;
}

// Mock data for doctors since the original data doesn't include complete doctor info
const doctorProfiles = [
  {
    id: "amb-123",
    name: "Dr. Edalin",
    specialty: "Dentist",
    avatar: "/assets/doctor-1.jpg",
    email: "edalin@example.com",
    phone: "+1 504 368 6874"
  },
  {
    id: "amb-456",
    name: "Dr. Shanta",
    specialty: "Cardiologist",
    avatar: "/assets/doctor-2.jpg",
    email: "shanta@example.com",
    phone: "+1 832 891 8403"
  },
  {
    id: "amb-789",
    name: "Dr. John",
    specialty: "Psychiatrist",
    avatar: "/assets/doctor-3.jpg",
    email: "john@example.com",
    phone: "+1 749 104 6291"
  }
];

type AppointmentWithDoctor = Appointment & {
  doctor?: {
    id?: string;
    name: string;
    specialty: string;
    avatar: string;
    email: string;
    phone: string;
  }
}

type DateFilter = {
  label: string;
  startDate: Date;
  endDate: Date;
}

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Debug mode counter
  const [titleClicks, setTitleClicks] = useState(0);
  const handleTitleClick = () => {
    const newCount = titleClicks + 1;
    setTitleClicks(newCount);
    
    // Enable debug mode after 5 clicks
    if (newCount === 5) {
      localStorage.setItem('debug_mode', 'true');
      toast.success('Debug mode enabled');
      devLog('Debug mode enabled');
    }
  };
  
  // Update page title
  useEffect(() => {
    document.title = "My Appointments | Emotions Health";
  }, []);

  // Current date
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(addDays(today, 6));
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  // Appointment counts
  const [counts, setCounts] = useState({
    upcoming: 0,
    cancelled: 0,
    completed: 0
  });

  // Date filter options
  const dateFilters: DateFilter[] = [
    {
      label: "Today",
      startDate: today,
      endDate: today
    },
    {
      label: "Yesterday",
      startDate: subDays(today, 1),
      endDate: subDays(today, 1)
    },
    {
      label: "Last 7 Days",
      startDate: subDays(today, 7),
      endDate: today
    },
    {
      label: "Last 30 Days",
      startDate: subDays(today, 30),
      endDate: today
    },
    {
      label: "This Month",
      startDate: startOfMonth(today),
      endDate: endOfMonth(today)
    },
    {
      label: "Last Month",
      startDate: startOfMonth(subMonths(today, 1)),
      endDate: endOfMonth(subMonths(today, 1))
    }
  ];

  const [cancelAppointmentId, setCancelAppointmentId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  const [moodMentors, setMoodMentors] = useState<MoodMentorProfile[]>([]);
  const [loadingMoodMentors, setLoadingMoodMentors] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchMoodMentors();
  }, [user?.id, activeTab, startDate, endDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        return;
      }
      
      devLog(`Fetching ${activeTab} appointments from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      
      const { data, error } = await appointmentService.getPatientAppointments(
        user.id,
        activeTab,
        startDate,
        endDate
      );

      if (error) throw new Error(error);

      // Convert database appointments to our Appointment interface and add mock doctor data
      const mappedAppointments: AppointmentWithDoctor[] = data.map(appt => {
        // Find a doctor profile based on ambassador_id
        const doctorProfile = doctorProfiles.find(d => d.id === appt.ambassador_id) || 
          doctorProfiles[Math.floor(Math.random() * doctorProfiles.length)];
        
        return {
          ...appt,
          doctor: {
            id: appt.ambassador_id || doctorProfile.id,
            name: doctorProfile.name,
            specialty: doctorProfile.specialty,
            avatar: doctorProfile.avatar,
            email: doctorProfile.email,
            phone: doctorProfile.phone
          }
        };
      });

      setAppointments(mappedAppointments);
      
      // Update counts
      const counts = {
        upcoming: mappedAppointments.filter(a => a.status === 'upcoming').length,
        completed: mappedAppointments.filter(a => a.status === 'completed').length,
        cancelled: mappedAppointments.filter(a => a.status === 'cancelled').length
      };
      setCounts(counts);
    } catch (error) {
      errorLog('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodMentors = async () => {
    try {
      setLoadingMoodMentors(true);
      devLog('Fetching mood mentors');
      
      const { data, error } = await moodMentorService.getMentorProfiles();
      
      if (error) throw new Error(error);
      
      const moodMentorProfiles: MoodMentorProfile[] = data.map(mentor => ({
        id: mentor.id,
        name: mentor.full_name,
        specialty: mentor.specialty || 'General Mental Health',
        avatar: mentor.avatar_url || '/assets/default-avatar.png',
        rating: 4.5, // TODO: Implement ratings
        reviews: 10, // TODO: Implement reviews
        available: mentor.availability_status === 'available',
        nextAvailable: 'Tomorrow, 10:00 AM', // TODO: Implement availability scheduling
        email: mentor.email,
        phone: mentor.phone_number,
        bio: mentor.bio,
        education: mentor.education?.[0]?.university
      }));
      
      setMoodMentors(moodMentorProfiles);
    } catch (error) {
      errorLog('Error fetching mood mentors:', error);
      toast.error('Failed to load available mood mentors');
    } finally {
      setLoadingMoodMentors(false);
    }
  };

  const getAppointmentIdCode = (id: string) => {
    return `#Apt${id.substring(0, 4)}`;
  };

  const handleApplyDateFilter = (filter: DateFilter) => {
    setStartDate(filter.startDate);
    setEndDate(filter.endDate);
    setDateFilterOpen(false);
  };

  const handleCustomDateRange = () => {
    // This would open a date range picker
    toast.info("Custom date range picker will be implemented soon");
    setDateFilterOpen(false);
  };

  const handleBookWithMoodMentor = (moodMentorId: string) => {
    navigate(`/booking?moodMentorId=${moodMentorId}`);
  };

  const handleViewMoodMentorProfile = (moodMentorId: string) => {
    // Find the mood mentor by ID to get their name
    const moodMentor = moodMentors.find(m => m.id === moodMentorId);
    if (moodMentor) {
      // Use the mood mentor's name in lowercase, replacing spaces with hyphens
      const nameSlug = moodMentor.name.toLowerCase().replace(/ /g, '-');
      navigate(`/mood-mentors/${nameSlug}?id=${moodMentorId}`);
    } else {
      // Fallback to ID if name not found
      navigate(`/mood-mentors/${moodMentorId}`);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      devLog(`Cancelling appointment: ${appointmentId}`);
      
      const { data, error } = await appointmentService.updateAppointmentStatus(
        appointmentId,
        'cancelled',
        cancellationReason
      );

      if (error) throw new Error(error);

      toast.success('Appointment cancelled successfully');
      setCancelAppointmentId(null);
      setCancellationReason('');
      fetchAppointments();
    } catch (error) {
      errorLog('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  // Replace the renderAppointmentList function with a more modern design
  const renderAppointmentList = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6 py-16">
          <div className="flex flex-col items-center justify-center">
            <Spinner size="lg" className="text-blue-600" />
            <p className="text-gray-500 mt-4">Loading your appointments...</p>
          </div>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 rounded-full p-5 mb-6">
              <CalendarClock className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium mb-3">No {activeTab} appointments</h3>
            <p className="text-gray-500 mb-8 max-w-md">
              {activeTab === "upcoming" 
                ? "You don't have any upcoming appointments scheduled. Book an appointment with one of our mood mentors to get started with your mental health journey."
                : activeTab === "cancelled" 
                ? "You don't have any cancelled appointments. All your cancelled appointments will appear here for reference."
                : "You don't have any completed appointments yet. After completing sessions, they will appear here for your records."}
            </p>
            <Button 
              onClick={() => navigate("/booking")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-medium"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {appointments.map((appointment) => (
          <div 
            key={appointment.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
          >
            <div className={cn(
              "border-l-4 h-full", 
              activeTab === "upcoming" ? "border-blue-600" : 
              activeTab === "completed" ? "border-green-600" : "border-orange-600"
            )}>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Left section: Doctor info */}
                  <div className="flex gap-4 items-center">
                    <Avatar className="h-16 w-16 rounded-full border-2 border-blue-100">
                      <AvatarImage src={appointment.doctor?.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                        {appointment.doctor?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          className={cn(
                            "font-normal rounded-full text-xs",
                            activeTab === "upcoming" ? "bg-blue-50 text-blue-700" : 
                            activeTab === "completed" ? "bg-green-50 text-green-700" : 
                            "bg-orange-50 text-orange-700"
                          )}
                        >
                          {getAppointmentIdCode(appointment.id)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {appointment.doctor?.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">{appointment.doctor?.specialty}</p>
                    </div>
                  </div>

                  {/* Right section: Appointment details */}
                  <div className="flex flex-col sm:flex-row gap-5 mt-4 md:mt-0 md:ml-auto">
                    {/* Date and time */}
                    <div className="flex flex-col">
                      <p className="text-xs uppercase text-gray-500 font-medium mb-1">Date & Time</p>
                      <div className="flex items-center text-gray-800 font-medium">
                        <CalendarIcon className="h-4 w-4 text-blue-500 mr-2" />
                        <p>{format(new Date(appointment.date), "dd MMM yyyy")}</p>
                      </div>
                      <div className="flex items-center text-gray-800 mt-1">
                        <Clock className="h-4 w-4 text-blue-500 mr-2" />
                        <p>{appointment.time}</p>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="flex flex-col sm:ml-6">
                      <p className="text-xs uppercase text-gray-500 font-medium mb-1">Session Type</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-normal py-1">
                          {appointment.type === "video" ? (
                            <div className="flex items-center">
                              <Video className="h-3 w-3 mr-1.5" />
                              <span>Video Call</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1.5" />
                              <span>Audio Call</span>
                            </div>
                          )}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-gray-600 font-normal">
                          {appointment.duration || "30 min"}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-col sm:ml-6">
                      <p className="text-xs uppercase text-gray-500 font-medium mb-1">Contact</p>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <p className="text-sm">{appointment.doctor?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-1">
                        <PhoneIcon className="h-4 w-4 text-blue-500" />
                        <p className="text-sm">{appointment.doctor?.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
                  {activeTab === "upcoming" && (
                    <>
                      <Button 
                        variant="outline"
                        className="rounded-full"
                        onClick={() => navigate(`/messages/${appointment.doctor?.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat Now
                      </Button>
                      <Button 
                        variant="outline"
                        className="rounded-full text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => setCancelAppointmentId(appointment.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 rounded-full"
                        onClick={() => navigate(`/session/${appointment.id}`)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Attend Session
                      </Button>
                    </>
                  )}
                  {activeTab === "cancelled" && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 rounded-full"
                      onClick={() => navigate("/booking")}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                  )}
                  {activeTab === "completed" && (
                    <>
                      <Button 
                        variant="outline"
                        className="rounded-full"
                        onClick={() => navigate(`/feedback/${appointment.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Leave Feedback
                      </Button>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 rounded-full"
                        onClick={() => navigate(`/booking?doctor=${appointment.doctor?.id}`)}
                      >
                        <CalendarPlus className="h-4 h-4 mr-2" />
                        Book Again
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add a button to book new appointments */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => navigate("/booking")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-medium"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book New Appointment
          </Button>
        </div>
      </div>
    );
  };

  // Helper to render badge based on count
  const renderCountBadge = (count: number) => {
    if (count === 0) return null;
    return <Badge className="ml-1 bg-blue-600 hover:bg-blue-600 text-white">{count}</Badge>;
  };

  const renderMoodMentorProfiles = () => {
    if (loadingMoodMentors) {
      return (
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Mental Health Mood Mentors</h2>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1 rounded-full" />
                  <Skeleton className="h-8 flex-1 rounded-full" />
                </div>
                <hr className="border-gray-100" />
              </div>
            ))}
          </div>
        </Card>
      );
    }
    
    if (moodMentors.length === 0) {
      return (
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Mental Health Mood Mentors</h2>
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">No mood mentors available at the moment</p>
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-200"
              onClick={fetchMoodMentors}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh List
            </Button>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Mental Health Mood Mentors</h2>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200"
            onClick={fetchMoodMentors}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moodMentors.map((moodMentor) => (
            <div key={moodMentor.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex gap-3 items-start">
                  <Avatar className="h-14 w-14 rounded-full border border-blue-100">
                    <AvatarImage src={moodMentor.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {moodMentor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{moodMentor.name}</h4>
                    <p className="text-sm text-slate-500">{moodMentor.specialty}</p>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{moodMentor.rating}</span>
                      <span className="text-xs text-slate-500">({moodMentor.reviews} reviews)</span>
                      
                      {moodMentor.available && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Contact information */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {moodMentor.email && (
                    <div className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span className="truncate">{moodMentor.email}</span>
                    </div>
                  )}
                  {moodMentor.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span>{moodMentor.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-full flex-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => handleViewMoodMentorProfile(moodMentor.id)}
                  >
                    View Profile
                  </Button>
                  <Button 
                    size="sm"
                    className="rounded-full flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleBookWithMoodMentor(moodMentor.id)}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // Debug component only shown to admin users for troubleshooting
  const DebugSection = () => {
    const runDiagnostics = async () => {
      try {
        devLog('Running diagnostics...');
        
        // Check API connection
        const healthResponse = await api.get('/api/health');
        if (!healthResponse.ok) {
          throw new Error(`API health check failed: ${healthResponse.statusText}`);
        }
        const healthData = await healthResponse.json();
        devLog('API Health Check:', healthData);
        
        // Check auth status
        devLog('Current User:', user);
        
        // Check appointments data
        const { data: appointments, error } = await appointmentService.getPatientAppointments(user?.id || '');
        devLog('Appointments Data:', appointments);
        if (error) {
          devLog('Appointments Error:', error);
        }
        
        toast.success('Diagnostics complete. Check dev console for details.');
      } catch (error) {
        errorLog('Diagnostics failed:', error);
        toast.error('Diagnostics failed');
      }
    };

    const setMoodMentorRole = async () => {
      try {
        devLog('Setting user role to Mood Mentor');
        
        const { data, error } = await moodMentorService.updateMentorProfile(user?.id || '', {
          role: 'mood_mentor' // Use the standardized role name
        });
        
        if (error) throw new Error(error);
        
        toast.success('Role updated to Mood Mentor');
      } catch (error) {
        errorLog('Error updating role:', error);
        toast.error('Failed to update role');
      }
    };

    return (
      <div className="mt-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Debug Tools</h3>
        <div className="space-y-4">
          <Button onClick={runDiagnostics} variant="outline" className="w-full">
            Run Diagnostics
          </Button>
          <Button onClick={setMoodMentorRole} variant="outline" className="w-full">
            Set as Mood Mentor
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <AlertDialog open={!!cancelAppointmentId} onOpenChange={(open) => {
        if (!open) {
          setCancelAppointmentId(null);
          setCancellationReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for cancellation (optional)
            </label>
            <Textarea
              id="cancellation-reason"
              placeholder="Please provide a reason for cancelling this appointment"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep appointment</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancelAppointmentId && handleCancelAppointment(cancelAppointmentId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-default" 
              onClick={handleTitleClick}
            >
              My Appointments
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your appointments with mental health mood mentors
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            onClick={() => navigate("/booking")}
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>

        {/* Status tabs and Filter section */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 pb-4">
          {/* Left side: Status tabs */}
          <div className="flex items-center space-x-4 overflow-x-auto pb-1">
            <button 
              className={cn(
                "flex items-center gap-2 py-2 px-3 rounded-full font-medium text-sm transition-colors",
                activeTab === "upcoming" 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              onClick={() => setActiveTab("upcoming")}
            >
              <CalendarClock className="h-4 w-4" />
              <span>Upcoming</span>
              {counts.upcoming > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-blue-600 h-5 min-w-5 px-1.5 text-xs font-medium text-white">
                  {counts.upcoming}
                </span>
              )}
            </button>
            <button 
              className={cn(
                "flex items-center gap-2 py-2 px-3 rounded-full font-medium text-sm transition-colors",
                activeTab === "completed" 
                  ? "bg-green-50 text-green-600" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              onClick={() => setActiveTab("completed")}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed</span>
              {counts.completed > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-green-600 h-5 min-w-5 px-1.5 text-xs font-medium text-white">
                  {counts.completed}
                </span>
              )}
            </button>
            <button 
              className={cn(
                "flex items-center gap-2 py-2 px-3 rounded-full font-medium text-sm transition-colors",
                activeTab === "cancelled" 
                  ? "bg-orange-50 text-orange-600" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
              onClick={() => setActiveTab("cancelled")}
            >
              <X className="h-4 w-4" />
              <span>Cancelled</span>
              {counts.cancelled > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-orange-600 h-5 min-w-5 px-1.5 text-xs font-medium text-white">
                  {counts.cancelled}
                </span>
              )}
            </button>
          </div>

          {/* Right side: Date picker styled like calendar */}
          <div className="mt-4 sm:mt-0">
            <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border rounded-lg bg-white shadow-sm"
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="whitespace-nowrap">
                    {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-auto min-w-[240px]" align="end">
                <div className="bg-white rounded-md shadow-md overflow-hidden">
                  {dateFilters.map((filter, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                      onClick={() => handleApplyDateFilter(filter)}
                    >
                      {filter.label}
                    </button>
                  ))}
                  <hr className="border-gray-100" />
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                    onClick={handleCustomDateRange}
                  >
                    Custom Range
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main content - full width without mood mentor sidebar */}
        <div className="w-full">
          {/* Appointments section */}
          <div className="mb-10">
            {renderAppointmentList()}
          </div>
          
          {/* Mood mentor profiles section */}
          <div>
            {renderMoodMentorProfiles()}
          </div>
        </div>
      </div>
      <DebugSection />
    </DashboardLayout>
  );
}
