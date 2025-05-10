import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, MessageCircle, Settings, Trash2, Users, FileText } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";

// Mock notification data for development
const mockNotifications = [
  {
    id: "1",
    type: "appointment",
    content: "Therapy session with Maria Chen scheduled for tomorrow at 2:00 PM. Please review her latest mood tracking data before the session.",
    timestamp: "10 minutes ago",
    read: false,
    avatar: "/placeholder.svg",
    senderName: "Appointment System",
    title: "Upcoming Therapy Session"
  },
  {
    id: "2",
    type: "patient",
    content: "URGENT: Your patient James Wilson reported severe anxiety symptoms in their latest check-in. Immediate attention may be required.",
    timestamp: "30 minutes ago",
    read: false,
    avatar: "/placeholder.svg",
    senderName: "Patient Monitoring System",
    title: "Patient Alert"
  },
  {
    id: "3",
    type: "group",
    content: "Your 'Anxiety & Depression Support Group' session starts in 1 hour. 8 participants have confirmed attendance.",
    timestamp: "1 hour ago",
    read: false,
    avatar: "/placeholder.svg",
    senderName: "Group Management",
    title: "Upcoming Group Session"
  },
  {
    id: "4",
    type: "message",
    content: "Dr. Thompson has reviewed your treatment plan for patient Sarah Brown and left comments for your consideration.",
    timestamp: "2 hours ago",
    read: true,
    avatar: "/placeholder.svg",
    senderName: "Dr. Thompson",
    title: "Treatment Plan Review"
  },
  {
    id: "5",
    type: "system",
    content: "Monthly supervision meeting with Dr. Rebecca Martinez scheduled for Friday at 3:00 PM. Please prepare your case presentations.",
    timestamp: "3 hours ago",
    read: true,
    avatar: null,
    senderName: "System",
    title: "Supervision Schedule"
  },
  {
    id: "6",
    type: "appointment",
    content: "Patient Alex Turner has requested to reschedule their session from Thursday 10:00 AM to Friday 2:00 PM. Please approve or suggest alternative times.",
    timestamp: "4 hours ago",
    read: true,
    avatar: "/placeholder.svg",
    senderName: "Scheduling System",
    title: "Rescheduling Request"
  },
  {
    id: "7",
    type: "patient",
    content: "New patient file received: Emily Davis, referred by Dr. Johnson for anxiety and depression. Please review and schedule initial consultation.",
    timestamp: "5 hours ago",
    read: true,
    avatar: "/placeholder.svg",
    senderName: "Patient Assignment",
    title: "New Patient Assignment"
  },
  {
    id: "8",
    type: "group",
    content: "Your trauma support group has reached capacity (12 members). Please review the waiting list and consider opening an additional group.",
    timestamp: "1 day ago",
    read: true,
    avatar: "/placeholder.svg",
    senderName: "Group Management",
    title: "Group Capacity Alert"
  },
  {
    id: "9",
    type: "system",
    content: "Reminder: Quarterly professional development workshop on 'Advanced CBT Techniques' is next week. 3 CPD credits available.",
    timestamp: "1 day ago",
    read: true,
    avatar: null,
    senderName: "Professional Development",
    title: "Workshop Reminder"
  },
  {
    id: "10",
    type: "message",
    content: "Clinical team meeting minutes from yesterday have been shared with you. Key topics: new treatment protocols and case load distribution.",
    timestamp: "2 days ago",
    read: true,
    avatar: "/placeholder.svg",
    senderName: "Clinical Team",
    title: "Meeting Minutes"
  },
  {
    id: "11",
    type: "system",
    content: "Your monthly patient outcome reports are ready for review. Overall improvement noted in 78% of your active cases.",
    timestamp: "2 days ago",
    read: true,
    avatar: null,
    senderName: "Analytics System",
    title: "Performance Metrics"
  },
  {
    id: "12",
    type: "patient",
    content: "Risk assessment alert: Patient Michael Roberts reported suicidal ideation in their mood tracker. Please follow up within 24 hours.",
    timestamp: "2 days ago",
    read: true,
    avatar: "/placeholder.svg",
    senderName: "Risk Monitoring",
    title: "Urgent Risk Alert"
  }
];

interface Notification {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  read: boolean;
  avatar?: string | null;
  senderName: string;
  title?: string;
  created_at?: string;
  user_id?: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  patientUpdates: boolean;
  groupNotifications: boolean;
  marketingCommunications: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    appointmentReminders: true,
    patientUpdates: true,
    groupNotifications: true,
    marketingCommunications: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    fetchNotificationPreferences();
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      if (!user?.id) return;

      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user?.id) return;

    try {
      const prefs = await notificationService.getPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const saveNotificationPreferences = async () => {
    if (!user?.id) return;

    try {
      await notificationService.savePreferences(preferences);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const formatNotificationDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };
  
  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      // Update UI first
      setNotifications(notifications.filter(n => n.id !== id));
      
      // Skip database operation for welcome notification or in development
      if (id === 'welcome-amb-1' || process.env.NODE_ENV !== 'production') return;
      
      // Delete from database
      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      // Update local state first
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      
      // Skip database operation for welcome notification or in development
      if (id === 'welcome-amb-1' || process.env.NODE_ENV !== 'production') return;
      
      // Update in database
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-5 w-5 text-ambassador-lavender" />;
      case "appointment":
        return <Clock className="h-5 w-5 text-ambassador-teal" />;
      case "patient":
        return <Users className="h-5 w-5 text-amber-600" />;
      case "group":
        return <Users className="h-5 w-5 text-blue-600" />;
      case "system":
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-ambassador-lavender/20 text-ambassador-lavender border-0 px-3 py-1 rounded-full">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllAsRead} 
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Notification Preferences</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-500">Receive email about your account activity</p>
                    </div>
                    <div>
                      <Switch 
                        id="email-notifications" 
                        checked={preferences.emailNotifications} 
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Appointment Reminders</h4>
                      <p className="text-sm text-slate-500">Get notified about upcoming appointments with patients</p>
                    </div>
                    <div>
                      <Switch 
                        id="appointment-notifications" 
                        checked={preferences.appointmentReminders} 
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, appointmentReminders: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Patient Updates</h4>
                      <p className="text-sm text-slate-500">Receive updates about your patients' activities and progress</p>
                    </div>
                    <div>
                      <Switch 
                        id="patient-updates" 
                        checked={preferences.patientUpdates} 
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, patientUpdates: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">Group Notifications</h4>
                      <p className="text-sm text-slate-500">Get notifications about group activities and member requests</p>
                    </div>
                    <div>
                      <Switch 
                        id="group-notifications" 
                        checked={preferences.groupNotifications} 
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, groupNotifications: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Communications</h4>
                      <p className="text-sm text-slate-500">Receive updates about new features and promotions</p>
                    </div>
                    <div>
                      <Switch 
                        id="marketing-notifications" 
                        checked={preferences.marketingCommunications} 
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, marketingCommunications: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button variant="secondary" size="sm" type="button">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      saveNotificationPreferences();
                      setIsSettingsOpen(false);
                    }}
                    className="bg-ambassador-lavender hover:bg-ambassador-lavender/90"
                  >
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="overflow-hidden border border-gray-200">
          <div>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="flex h-12 justify-start bg-transparent p-0 w-full">
                <TabsTrigger
                  value="all"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-ambassador-lavender data-[state=active]:shadow-none rounded-none h-12"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-ambassador-lavender data-[state=active]:shadow-none rounded-none h-12"
                >
                  Unread
                </TabsTrigger>
                <TabsTrigger
                  value="message"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-ambassador-lavender data-[state=active]:shadow-none rounded-none h-12"
                >
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="appointment"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-ambassador-lavender data-[state=active]:shadow-none rounded-none h-12"
                >
                  Appointments
                </TabsTrigger>
                <TabsTrigger
                  value="patient"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-ambassador-lavender data-[state=active]:shadow-none rounded-none h-12"
                >
                  Patients
                </TabsTrigger>
                <TabsTrigger
                  value="group"
                  className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-ambassador-lavender data-[state=active]:shadow-none rounded-none h-12"
                >
                  Groups
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center">
                <div className="animate-spin h-10 w-10 mx-auto rounded-full border-t-2 border-ambassador-lavender border-r-2 border-transparent"></div>
                <p className="mt-4 text-gray-500">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <ul className="divide-y">
                {filteredNotifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className="flex items-start p-4 hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 mr-4">
                      {notification.avatar ? (
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          <img 
                            src={notification.avatar} 
                            alt={notification.senderName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                          {getIconByType(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-16 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No notifications to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 