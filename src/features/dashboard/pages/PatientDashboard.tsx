import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Calendar, 
  MessageSquare, 
  Phone, 
  Book, 
  Settings, 
  LogOut,
  User,
  Clock,
  Video,
  UserPlus,
  Users,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  BadgeHelp,
  LineChart,
  Heart,
  ExternalLink,
  BookOpen,
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart,
  HeartPulse,
  Download
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import MoodAnalytics from "../components/MoodAnalytics";
import MoodAssessment from "../components/MoodAssessment";
import MoodSummaryCard from "../components/MoodSummaryCard";
import EmotionalHealthWheel from "../components/EmotionalHealthWheel";
import { Appointment as AppointmentRecord, Message, UserProfile } from "@/types/database.types";
import { format, parseISO } from "date-fns";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { api } from "@/lib/api";
import { errorLog } from "@/utils/environment";

// Define interfaces for appointment data
interface Ambassador {
  name: string;
  specialization: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  ambassador?: Ambassador;
  notes?: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [supportGroups, setSupportGroups] = useState<any[]>([]);
  const [recentJournalEntries, setRecentJournalEntries] = useState<any[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<string>("all");
  const [lastCheckIn, setLastCheckIn] = useState<string>("");
  const [lastCheckInDate, setLastCheckInDate] = useState<string>("");
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string>("");
  const [userMetrics, setUserMetrics] = useState({
    moodScore: 0,
    stressLevel: 0,
    consistency: 0,
    lastCheckInStatus: "No check-ins yet",
    streak: 0,
    firstCheckInDate: ""
  });
  const [hasAssessments, setHasAssessments] = useState(false);
  const [appointmentReports, setAppointmentReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Set last check-in time to current time (for mood tracking)
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastCheckIn(timeString);
    
    // For the date display
    const today = new Date();
    setLastCheckInDate(`${today.toLocaleString('default', { month: 'short' })} ${today.getDate()}, ${today.getFullYear()}`);
    
    // Initialize last assessment date to "Not taken" by default
    setLastAssessmentDate("Not taken");

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        if (!user?.id) {
          navigate('/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await api.get(`/api/patients/${user.id}/profile`);
        const profileData = await profileResponse.json();

        if (isMounted) {
          setProfile(profileData);
        }

        // Fetch appointments
        const appointmentsResponse = await api.get(`/api/patients/${user.id}/appointments`);
        const appointmentsData = await appointmentsResponse.json();

        if (isMounted) {
          setAppointments(appointmentsData);
          // Filter upcoming appointments
          const upcoming = appointmentsData.filter((appt: Appointment) => appt.status === 'upcoming');
          setUpcomingAppointments(upcoming);
        }

        // Fetch messages
        const messagesResponse = await api.get(`/api/patients/${user.id}/messages`);
        const messagesData = await messagesResponse.json();

        if (isMounted) {
          setMessages(messagesData);
        }

        // Fetch support groups
        const groupsResponse = await api.get(`/api/support-groups`);
        const groupsData = await groupsResponse.json();

        if (isMounted) {
          setSupportGroups(groupsData);
        }

        // Fetch journal entries
        const journalResponse = await api.get(`/api/patients/${user.id}/journal-entries`);
        const journalData = await journalResponse.json();

        if (isMounted) {
          setRecentJournalEntries(journalData);
        }

        // Fetch user metrics
        const metricsResponse = await api.get(`/api/patients/${user.id}/metrics`);
        const metricsData = await metricsResponse.json();

        if (isMounted) {
          setUserMetrics(metricsData);
        }

        // Fetch appointment reports
        const reportsResponse = await api.get(`/api/patients/${user.id}/appointment-reports`);
        const reportsData = await reportsResponse.json();

        if (isMounted) {
          setAppointmentReports(reportsData);
          setReportsLoading(false);
        }

      } catch (error) {
        errorLog("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    try {
      const response = await api.put(`/api/patients/${user?.id}/profile`, updatedData);
      const data = await response.json();
      
      if (data) {
        setProfile(prev => ({ ...prev!, ...updatedData }));
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      errorLog("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleJournalClick = () => {
    navigate("/journal");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleSignout = async () => {
    try {
      await api.post('/api/auth/logout');
      navigate('/login');
    } catch (error) {
      errorLog("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text("Patient Health Report", 20, 20);
      
      // Add patient info
      doc.setFontSize(12);
      doc.text(`Name: ${profile?.first_name} ${profile?.last_name}`, 20, 40);
      doc.text(`Patient ID: ${profile?.patient_id}`, 20, 50);
      doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, 60);
      
      // Add mood metrics
      doc.text("Mood Metrics", 20, 80);
      doc.autoTable({
        startY: 90,
        head: [["Metric", "Value"]],
        body: [
          ["Mood Score", userMetrics.moodScore.toString()],
          ["Stress Level", userMetrics.stressLevel.toString()],
          ["Consistency", userMetrics.consistency.toString()],
          ["Current Streak", userMetrics.streak.toString()]
        ],
      });
      
      // Add appointments
      const appointmentData = appointments.map(appt => [
        appt.date,
        appt.time,
        appt.type,
        appt.status,
        appt.ambassador?.name || "N/A"
      ]);
      
      doc.text("Appointment History", 20, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 30,
        head: [["Date", "Time", "Type", "Status", "Ambassador"]],
        body: appointmentData,
      });
      
      // Save the PDF
      doc.save(`patient_report_${new Date().toISOString()}.pdf`);
      toast.success("Report downloaded successfully");
    } catch (error) {
      errorLog("Error generating PDF:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleExportAppointment = (appointmentId: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text("Appointment Details", 20, 20);
      
      // Add appointment info
      doc.setFontSize(12);
      doc.text(`Appointment ID: ${appointment.id}`, 20, 40);
      doc.text(`Date: ${appointment.date}`, 20, 50);
      doc.text(`Time: ${appointment.time}`, 20, 60);
      doc.text(`Type: ${appointment.type}`, 20, 70);
      doc.text(`Status: ${appointment.status}`, 20, 80);
      
      if (appointment.ambassador) {
        doc.text(`Ambassador: ${appointment.ambassador.name}`, 20, 90);
        doc.text(`Specialization: ${appointment.ambassador.specialization}`, 20, 100);
      }
      
      if (appointment.notes) {
        doc.text("Notes:", 20, 110);
        doc.text(appointment.notes, 20, 120);
      }
      
      // Save the PDF
      doc.save(`appointment_${appointmentId}_${new Date().toISOString()}.pdf`);
      toast.success("Appointment details downloaded");
    } catch (error) {
      errorLog("Error generating appointment PDF:", error);
      toast.error("Failed to generate appointment details");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Title and User Welcome */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back, {profile?.first_name || "User"}
          </p>
        </div>

        {/* Health Records Overview */}
        <div>
          <h2 className="text-xl font-medium mb-4">Emotional Health Records</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Mood Score */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <HeartPulse className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium">Mood Score</span>
                  </div>
                  {hasAssessments && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Active</span>
                  )}
                </div>
                <div className="text-3xl font-bold">{userMetrics.moodScore.toFixed(1)}</div>
                <p className="text-xs text-slate-500 mt-2">
                  {hasAssessments ? "Average from recent check-ins" : "Start your first check-in"}
                </p>
              </CardContent>
            </Card>

            {/* Stress Level */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Stress Level</span>
                  </div>
                  {hasAssessments && userMetrics.stressLevel > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Tracked</span>
                  )}
                </div>
                
                {userMetrics.stressLevel > 0 ? (
                  <>
                    <div className="text-3xl font-bold mb-1">
                      {Math.round(userMetrics.stressLevel * 10)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500 ease-in-out"
                        style={{ 
                          width: `${Math.round(userMetrics.stressLevel * 10)}%`,
                          backgroundColor: userMetrics.stressLevel < 3 ? '#4ade80' : 
                                         userMetrics.stressLevel < 5 ? '#a3e635' : 
                                         userMetrics.stressLevel < 7 ? '#facc15' : 
                                         userMetrics.stressLevel < 8 ? '#fb923c' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Based on your recent assessment
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold mb-1">
                      <span className="opacity-70">—</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="h-2 rounded-full bg-gray-300 w-0"></div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Complete your first assessment
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Last Check-in */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-indigo-500 mr-2" />
                    <span className="text-sm font-medium">Last Check-in</span>
                  </div>
                </div>
                <div className="text-3xl font-bold">{hasAssessments ? "Today" : "None"}</div>
                <p className="text-xs text-slate-500 mt-2">
                  {hasAssessments ? `${lastCheckIn}, ${lastCheckInDate}` : "Complete your first assessment"}
                </p>
              </CardContent>
            </Card>

            {/* Consistency */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <BarChart className="w-5 h-5 text-emerald-500 mr-2" />
                    <span className="text-sm font-medium">Consistency</span>
                  </div>
                  {hasAssessments && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      {userMetrics.streak > 0 ? `${userMetrics.streak} day${userMetrics.streak !== 1 ? 's' : ''} streak` : 'Active Streak'}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold">
                  {hasAssessments 
                    ? userMetrics.consistency > 0 
                      ? `${Math.round(userMetrics.consistency * 10)}%` 
                      : userMetrics.streak > 0 
                        ? `${userMetrics.streak} day${userMetrics.streak !== 1 ? 's' : ''}` 
                      : <span className="opacity-70 animate-pulse">—</span> 
                    : <span className="opacity-70">—</span>}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {hasAssessments 
                    ? userMetrics.consistency > 0 
                      ? userMetrics.streak > 1 
                        ? `Keep your ${userMetrics.streak}-day streak going!` 
                        : "Keep showing up daily"
                      : <span className="flex items-center"><span className="text-xs inline-block text-emerald-600">Keep showing up daily</span></span>
                    : "Start tracking your mood"}
                  {userMetrics.firstCheckInDate && (
                    <span className="block mt-1 text-slate-400">Since {userMetrics.firstCheckInDate}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mood Check-in and Recent Assessments - 2 columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Emotional Health Wheel - replaces Daily Check-in */}
          <EmotionalHealthWheel 
            stressLevel={userMetrics.stressLevel} 
            lastCheckIn={lastAssessmentDate}
            onViewDetails={() => navigate('/patient-dashboard/reports')}
            hasAssessments={hasAssessments}
          />

          {/* Mood Summary Card */}
          <Card className="h-full bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Recent Trend</CardTitle>
              <CardDescription>Based on recent assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <MoodSummaryCard />
            </CardContent>
          </Card>
        </div>

        {/* Appointment Section */}
        <div>
          {/* Reports Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-xl font-medium">Appointment Reports</h2>
              <div className="flex items-center mt-2 sm:mt-0 gap-2">
                <div className="relative">
                  <select 
                    className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    value={appointmentFilter}
                    onChange={(e) => {
                      setAppointmentFilter(e.target.value);
                      // Loading indicator will be shown by the useEffect that watches appointmentFilter
                    }}
                  >
                    <option value="all">All Appointments</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={reportsLoading || appointmentReports.length === 0}>
                  <Download className="h-4 w-4 mr-1" />
                  Export All
                </Button>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#20C0F3' }} className="rounded-t-lg">
                      <th className="text-left text-sm font-medium text-white p-4 first:rounded-tl-lg">ID</th>
                      <th className="text-left text-sm font-medium text-white p-4">M.H Ambassador</th>
                      <th className="text-left text-sm font-medium text-white p-4">Date</th>
                      <th className="text-left text-sm font-medium text-white p-4">Type</th>
                      <th className="text-left text-sm font-medium text-white p-4 last:rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportsLoading ? (
                      // Loading skeleton
                      Array(4).fill(null).map((_, i) => (
                        <tr key={`skeleton-${i}`} className="animate-pulse">
                          <td className="p-4">
                            <div className="h-4 bg-slate-200 rounded w-20"></div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-32"></div>
                                <div className="h-3 bg-slate-200 rounded w-24"></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 bg-slate-200 rounded w-28"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 bg-slate-200 rounded w-16"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-6 bg-slate-200 rounded w-24"></div>
                          </td>
                        </tr>
                      ))
                    ) : appointmentReports.length === 0 ? (
                      // No appointments found
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No appointments found matching your filter criteria
                        </td>
                      </tr>
                    ) : (
                      // Render actual appointment data
                      appointmentReports.map((report) => {
                        // Determine status badge styling
                        const getBadgeClasses = (status: string) => {
                          switch(status.toLowerCase()) {
                            case 'upcoming':
                              return "bg-indigo-100 text-indigo-700 hover:bg-indigo-200";
                            case 'completed':
                              return "bg-purple-100 text-purple-700 hover:bg-purple-200";
                            case 'cancelled':
                              return "bg-red-100 text-red-700 hover:bg-red-200";
                            default:
                              return "bg-slate-100 text-slate-700 hover:bg-slate-200";
                          }
                        };

                        // Determine badge dot color
                        const getDotColor = (status: string) => {
                          switch(status.toLowerCase()) {
                            case 'upcoming':
                              return "bg-indigo-500";
                            case 'completed':
                              return "bg-purple-500";
                            case 'cancelled':
                              return "bg-red-500";
                            default:
                              return "bg-slate-500";
                          }
                        };

                        return (
                          <tr key={report.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="p-4">
                              <span className="text-blue-600 font-medium">{report.id}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                  {report.ambassador.avatar_url ? (
                                    <img 
                                      src={report.ambassador.avatar_url}
                                      alt={report.ambassador.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-blue-500 font-medium">
                                      {report.ambassador.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{report.ambassador.name}</div>
                                  <div className="text-xs text-slate-500">{report.ambassador.specialization}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{`${report.date}, ${report.time}`}</td>
                            <td className="p-4 text-sm">{report.type}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getBadgeClasses(report.status)} font-medium px-3 py-1 rounded-full`}>
                                  <span className="flex items-center">
                                    <span className={`h-1.5 w-1.5 rounded-full ${getDotColor(report.status)} mr-1.5`}></span>
                                    {report.status}
                                  </span>
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0" 
                                  onClick={() => handleExportAppointment(report.id)}
                                >
                                  <FileText className="h-3.5 w-3.5 text-slate-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Journal Entries</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600"
              onClick={() => navigate('/patient-dashboard/journal')}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              // Loading skeletons for journal entries
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="hover:border-blue-200 cursor-pointer transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : recentJournalEntries.length === 0 ? (
              // No entries message
              <Card className="col-span-full p-5 text-center">
                <CardContent>
                  <p className="text-slate-500 mb-3">No journal entries yet</p>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/patient-dashboard/journal/new')}
                  >
                    Create Your First Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Display actual journal entries
              recentJournalEntries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="hover:border-blue-200 cursor-pointer transition-colors"
                  onClick={() => navigate(`/patient-dashboard/journal/${entry.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className={
                        entry.mood === 'Happy' || entry.mood === 'Grateful' ? "bg-green-50 border-green-200 text-green-700" :
                        entry.mood === 'Calm' ? "bg-blue-50 border-blue-200 text-blue-700" :
                        entry.mood === 'Anxious' || entry.mood === 'Worried' ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                        entry.mood === 'Sad' || entry.mood === 'Overwhelmed' ? "bg-red-50 border-red-200 text-red-700" :
                        "bg-slate-50 border-slate-200 text-slate-700"
                      }>
                        {entry.mood || 'Neutral'}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.created_at).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-medium mb-2 line-clamp-1">{entry.title || 'Untitled Entry'}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {entry.content ? entry.content.replace(/<[^>]*>/g, '') : 'No content'}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
