import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  Calendar,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  FileText,
  Users,
  Bell,
  BookOpen,
  Activity,
  User,
  Clock,
  Shield,
  BadgeHelp,
  ChevronRight,
  Clock3,
  Search,
  Trash2,
  Sparkles,
  BarChart2,
  UserCheck,
  Briefcase,
  Brain,
  UserCog,
  Award,
  PlayCircle,
  Zap,
  ChevronLeft,
  Star,
  Info,
  HeartPulse,
  LayoutDashboard
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Stabilizer } from "@/components/ui/stabilizer";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  created_at: string;
  read: boolean;
  type: 'appointment' | 'message' | 'journal' | 'mood' | 'other';
  user_id?: string;
}

interface SearchResult {
  title: string;
  description?: string;
  icon?: any;
  href: string;
  category: string;
}

const patientNavigation = [
  {
    section: "Main",
    items: [
      { name: "Dashboard", href: "/patient-dashboard", icon: LayoutDashboard },
      { name: "Appointments", href: "/patient-dashboard/appointments", icon: Calendar },
      { name: "Mood Tracker", href: "/patient-dashboard/mood-tracker", icon: Activity },
      { name: "Journal", href: "/patient-dashboard/journal", icon: FileText },
      { name: "Messages", href: "/patient-dashboard/messages", icon: MessageSquare },
    ]
  },
  {
    section: "Resources",
    items: [
      { name: "Resources", href: "/patient-dashboard/resources", icon: BookOpen },
      { name: "Favorites", href: "/patient-dashboard/favorites", icon: Heart },
      { name: "Reports", href: "/patient-dashboard/reports", icon: BarChart2 },
    ]
  },
  {
    section: "Account",
    items: [
      { name: "Profile", href: "/patient-dashboard/profile", icon: User },
      { name: "Notifications", href: "/patient-dashboard/notifications", icon: Bell },
      { name: "Settings", href: "/patient-dashboard/settings", icon: Settings },
      { name: "Help Center", href: "/patient-dashboard/help", icon: BadgeHelp },
    ]
  }
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, signout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // State for notification dialog
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const location = useLocation();

  // Add state for search dropdown
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Define search categories and items
  const searchableItems: SearchResult[] = [
    // Dashboard
    {
      title: "Dashboard",
      description: "View your dashboard summary and key metrics",
      icon: LayoutDashboard,
      href: "/patient-dashboard",
      category: "Pages"
    },
    // Appointments
    {
      title: "Appointments",
      description: "Manage your upcoming and past appointments",
      icon: Calendar,
      href: "/patient-dashboard/appointments",
      category: "Pages"
    },
    // Mood Tracker
    {
      title: "Mood Tracker",
      description: "Track and monitor your mood over time",
      icon: Activity,
      href: "/patient-dashboard/mood-tracker",
      category: "Pages"
    },
    // Journal
    {
      title: "Journal",
      description: "Record your thoughts and feelings",
      icon: FileText,
      href: "/patient-dashboard/journal",
      category: "Pages"
    },
    // Create Journal Entry
    {
      title: "Create Journal Entry",
      description: "Write a new journal entry",
      icon: FileText,
      href: "/patient-dashboard/journal/new",
      category: "Journal"
    },
    // Messages
    {
      title: "Messages",
      description: "Chat with your mood mentor",
      icon: MessageSquare,
      href: "/patient-dashboard/messages",
      category: "Pages"
    },
    // Resources
    {
      title: "Resources",
      description: "Explore mental health resources",
      icon: BookOpen,
      href: "/patient-dashboard/resources",
      category: "Pages"
    },
    // Favorites
    {
      title: "Favorites",
      description: "View your favorite resources and mood mentors",
      icon: Heart,
      href: "/patient-dashboard/favorites",
      category: "Pages"
    },
    // Reports
    {
      title: "Reports",
      description: "View detailed reports of your progress",
      icon: BarChart2,
      href: "/patient-dashboard/reports",
      category: "Pages"
    },
    // Profile
    {
      title: "Profile",
      description: "View and edit your profile",
      icon: User,
      href: "/patient-dashboard/profile",
      category: "Account"
    },
    // Notifications
    {
      title: "Notifications",
      description: "View your notifications",
      icon: Bell,
      href: "/patient-dashboard/notifications",
      category: "Account"
    },
    // Settings
    {
      title: "Settings",
      description: "Manage your account settings",
      icon: Settings,
      href: "/patient-dashboard/settings",
      category: "Account"
    },
    // Help Center
    {
      title: "Help Center",
      description: "Get help with using the platform",
      icon: BadgeHelp,
      href: "/patient-dashboard/help",
      category: "Account"
    }
  ];

  // Update the current path when location changes
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // Handle mobile sidebar
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Mock fetch notifications (replace with actual API call)
  useEffect(() => {
    const mockNotifications = [
      {
        id: "1",
        title: "New appointment",
        content: "You have a new appointment with Dr. Smith tomorrow at 10:00 AM",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: false,
        type: 'appointment' as const
      },
      {
        id: "2",
        title: "Journal reminder",
        content: "Don't forget to write in your journal today",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        type: 'journal' as const
      },
      {
        id: "3",
        title: "New message",
        content: "You have a new message from your mood mentor",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        read: false,
        type: 'message' as const
      }
    ];

    setNotifications(mockNotifications);
    setUnreadNotifications(mockNotifications.filter(n => !n.read).length);
    setUnreadMessages(1); // Mock unread messages
  }, []);

  // Handle click outside of notification dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    if (value.length > 0) {
      const filteredResults = searchableItems.filter(item => 
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
      );
      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (href: string) => {
    setSearchOpen(false);
    navigate(href);
  };

  // Mark notification as read
  const markNotificationAsRead = async (id: string) => {
    // In a real app, make an API call to mark notification as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setNotificationDialogOpen(true);
    markNotificationAsRead(notification.id);
    setNotificationOpen(false);
  };

  // Handle signout
  const handleSignout = async () => {
    await signout();
    navigate('/login');
  };

  // Format time for notifications
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'journal':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'mood':
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dashboard-container">
      {/* Main Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          className="lg:hidden" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        
        {/* Mobile Logo */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-xl font-bold">EmotiHealth</h1>
        </div>
        
        {/* Mobile Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || ''} alt={user?.first_name || 'User'} />
                <AvatarFallback>{user?.first_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.first_name} {user?.last_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/patient-dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/patient-dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        {/* Sidebar/Navigation */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-transform lg:static lg:block",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
          role="navigation"
        >
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200">
              <Link to="/patient-dashboard" className="flex items-center space-x-2">
                <HeartPulse className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-semibold text-gray-900">Emotions</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              {patientNavigation.map((section) => (
                <div key={section.section} className="mb-6">
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.section}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => isMobile && setSidebarOpen(false)}
                        >
                          <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                          <span>{item.name}</span>
                          {item.name === "Messages" && unreadMessages > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {unreadMessages}
                            </Badge>
                          )}
                          {item.name === "Notifications" && unreadNotifications > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {unreadNotifications}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden dashboard-content">
          <Stabilizer>
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </Stabilizer>
        </main>
      </div>

      {/* Notification detail dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {selectedNotification?.created_at && formatTime(selectedNotification.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{selectedNotification?.content}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotificationDialogOpen(false)}
            >
              Close
            </Button>
            {selectedNotification?.type === 'appointment' && (
              <Button onClick={() => {
                navigate('/patient-dashboard/appointments');
                setNotificationDialogOpen(false);
              }}>
                View Appointments
              </Button>
            )}
            {selectedNotification?.type === 'message' && (
              <Button onClick={() => {
                navigate('/patient-dashboard/messages');
                setNotificationDialogOpen(false);
              }}>
                View Messages
              </Button>
            )}
            {selectedNotification?.type === 'journal' && (
              <Button onClick={() => {
                navigate('/patient-dashboard/journal');
                setNotificationDialogOpen(false);
              }}>
                View Journal
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardLayout; 