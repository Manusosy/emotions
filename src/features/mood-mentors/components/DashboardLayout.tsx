import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notificationService, Notification } from "@/services/notificationService";
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
  LayoutDashboard,
  Edit,
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
import { useTheme } from "next-themes";
import { Logo } from "@/components/logos/Logo";
import { Separator } from "@/components/ui/separator";
import { useMobileDetect } from "@/hooks/use-mobile-detect";
import { notificationService as notificationServiceLib } from "@/lib/notificationService";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search as SearchComponent } from "@/components/ui/search";
import { UserRole } from "@/types/database.types";
import { errorLog, devLog } from "@/utils/environment";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  icon?: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const moodMentorNavigation = [
  {
    section: "Main",
    items: [
      { name: "Overview", href: "/mood-mentor-dashboard", icon: LayoutDashboard },
      { name: "Appointments", href: "/mood-mentor-dashboard/appointments", icon: Calendar },
      { name: "Patients", href: "/mood-mentor-dashboard/patients", icon: Users },
      { name: "Support Groups", href: "/mood-mentor-dashboard/groups", icon: UserCheck },
      { name: "Messages", href: "/mood-mentor-dashboard/messages", icon: MessageSquare },
    ]
  },
  {
    section: "Professional",
    items: [
      { name: "Resources", href: "/mood-mentor-dashboard/resources", icon: BookOpen },
      { name: "Reviews", href: "/mood-mentor-dashboard/reviews", icon: Star },
      { name: "Analytics", href: "/mood-mentor-dashboard/analytics", icon: BarChart2 },
    ]
  },
  {
    section: "Account",
    items: [
      { name: "Profile", href: "/mood-mentor-dashboard/profile", icon: User },
      { name: "Notifications", href: "/mood-mentor-dashboard/notifications", icon: Bell },
      { name: "Settings", href: "/mood-mentor-dashboard/settings", icon: Settings },
      { name: "Help Center", href: "/mood-mentor-dashboard/help", icon: BadgeHelp },
    ]
  }
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, signout, getFullName, isAuthenticated } = useAuth();
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
    // Overview
    {
      title: "Dashboard Overview",
      description: "View your dashboard summary and key metrics",
      icon: LayoutDashboard,
      href: "/mood-mentor-dashboard",
      category: "Pages"
    },
    // Appointments
    {
      title: "Appointments",
      description: "Manage your upcoming and past appointments",
      icon: Calendar,
      href: "/mood-mentor-dashboard/appointments",
      category: "Pages"
    },
    {
      title: "Schedule Management",
      description: "Set your availability and manage appointment slots",
      icon: Clock,
      href: "/mood-mentor-dashboard/appointments/schedule",
      category: "Appointments"
    },
    // Patients
    {
      title: "Patient List",
      description: "View and manage your patient list",
      icon: Users,
      href: "/mood-mentor-dashboard/patients",
      category: "Pages"
    },
    {
      title: "Patient Reports",
      description: "Access patient progress reports",
      icon: FileText,
      href: "/mood-mentor-dashboard/patients/reports",
      category: "Patients"
    },
    // Support Groups
    {
      title: "Support Groups",
      description: "Manage your support groups and sessions",
      icon: UserCheck,
      href: "/mood-mentor-dashboard/groups",
      category: "Pages"
    },
    // Resources
    {
      title: "Resource Library",
      description: "Access and manage therapeutic resources",
      icon: BookOpen,
      href: "/mood-mentor-dashboard/resources",
      category: "Pages"
    },
    // Reviews
    {
      title: "Reviews & Feedback",
      description: "View and manage patient reviews and feedback",
      icon: Star,
      href: "/mood-mentor-dashboard/reviews",
      category: "Pages"
    },
    // Analytics
    {
      title: "Analytics Dashboard",
      description: "View performance metrics and insights",
      icon: BarChart2,
      href: "/mood-mentor-dashboard/analytics",
      category: "Pages"
    },
    // Profile & Settings
    {
      title: "Profile Settings",
      description: "Update your professional profile",
      icon: User,
      href: "/mood-mentor-dashboard/profile",
      category: "Settings"
    },
    {
      title: "Account Settings",
      description: "Manage your account preferences",
      icon: Settings,
      href: "/mood-mentor-dashboard/settings",
      category: "Settings"
    },
    {
      title: "Help Center",
      description: "Get help and support",
      icon: BadgeHelp,
      href: "/mood-mentor-dashboard/help",
      category: "Support"
    }
  ];

  useEffect(() => {
    // Verify user is authenticated, if not redirect to login
    if (!isAuthenticated) {
      const storedAuthState = localStorage.getItem('auth_state');
      if (storedAuthState) {
        try {
          const { isAuthenticated: storedAuth, userRole } = JSON.parse(storedAuthState);
          if (!storedAuth || userRole !== 'moodMentor') {
            const redirectTimer = setTimeout(() => {
            window.location.href = '/login';
            }, 300);
            return () => clearTimeout(redirectTimer);
          }
        } catch (e) {
          errorLog("Error parsing stored auth state:", e);
        }
      }
      return;
    }

    setCurrentPath(window.location.pathname);
  }, [window.location.pathname, isAuthenticated, navigate]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (!user?.id) return;
      
      try {
        // Get notifications from our service
        const notifications = await notificationService.getNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
        
        // For messages, we'll implement this later with a messageService
        setUnreadMessages(0);
      } catch (error) {
        errorLog('Error fetching unread counts:', error);
      }
    };

    if (user?.id) {
      fetchUnreadCounts();
    }
  }, [user?.id]);

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

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      try {
        const notifications = await notificationService.getNotifications();
        
        const welcomeNotification = {
          id: 'welcome-amb-1',
          type: 'system',
          content: 'Hello and welcome to your Mood Mentor Dashboard! Here you can manage your client appointments, resources, and therapeutic tools.',
          timestamp: 'Just now',
          read: false,
          avatar: null,
          senderName: 'System',
          title: 'Welcome to Emotions Mood Mentor Hub'
        };

        if (notifications.length > 0) {
          const hasWelcome = notifications.some(n => n.title?.includes('Welcome'));
          if (!hasWelcome) {
            setNotifications([welcomeNotification, ...notifications]);
            setUnreadNotifications(prev => prev + 1);
          } else {
            setNotifications(notifications);
          }
        } else {
          setNotifications([welcomeNotification]);
          setUnreadNotifications(1);
        }
      } catch (error) {
        errorLog('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setIsSearchOpen(value.length > 0);
    
    if (!value) {
      setSearchResults([]);
      return;
    }

    const results = searchableItems.filter(
      item =>
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
    );

    setSearchResults(results);
  };

  // Handle search result click
  const handleSearchResultClick = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(href);
  };

  const markNotificationAsRead = async (id: string, read: boolean) => {
    try {
      if (id.startsWith('welcome-amb-')) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === id ? { ...notification, read } : notification
          )
        );
        setUnreadNotifications(prev => prev - 1);
        return;
      }

      await notificationService.markAsRead(id);

      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, read } : notification
        )
      );

      setUnreadNotifications(prev => read ? Math.max(0, prev - 1) : prev + 1);
    } catch (error) {
      errorLog('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id, true);
    }
    
    setSelectedNotification(notification);
    setNotificationDialogOpen(true);
  };

  const handleSignout = async () => {
    try {
      await signout();
      navigate("/login");
    } catch (error) {
      errorLog("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const clientSideNotifications = notifications.filter(n => n.id.startsWith('welcome-amb-') && !n.read);
      const databaseNotifications = notifications.filter(n => !n.id.startsWith('welcome-amb-') && !n.read);
      
      if (clientSideNotifications.length > 0) {
        setNotifications(prev => prev.map(n => 
          n.id.startsWith('welcome-amb-') && !n.read 
            ? { ...n, read: true } 
            : n
        ));
      }
      
      if (databaseNotifications.length > 0) {
        await notificationService.markAllAsRead();
        
        setNotifications(prev => prev.map(n => 
          !n.id.startsWith('welcome-amb-') && !n.read 
            ? { ...n, read: true } 
            : n
        ));
      }
      
      setUnreadNotifications(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      errorLog('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
           ' at ' + 
           date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
        } bg-[#20C0F3] border-r border-[#20C0F3]/20`}
      >
        <div className="h-full flex flex-col">
          {/* Logo area */}
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <Link to="/mood-mentor-dashboard" className="flex items-center space-x-2">
              {sidebarOpen ? (
                <img 
                  src="/assets/emotions-app-logo.png" 
                  alt="Emotions Logo" 
                  className="h-8 w-auto"
                />
              ) : (
                <Brain className="h-7 w-7 text-white" />
              )}
            </Link>
            {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:flex hidden text-white hover:bg-white/20"
                >
                <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
                </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {moodMentorNavigation.map((section) => (
              <div key={section.section} className="mb-4">
                {sidebarOpen && (
                  <h3 className="px-4 text-sm font-medium text-white uppercase tracking-wider mb-2">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = currentPath === item.href;
                    const hasNotification = 
                      (item.name === "Messages" && unreadMessages > 0) ||
                      (item.name === "Notifications" && unreadNotifications > 0);
                    
                    return (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-white text-[#0B7DA3] shadow-md font-medium border-0"
                            : "text-white hover:bg-white/10"
                        } ${!sidebarOpen ? "justify-center" : ""} relative`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "text-[#0B7DA3]" : "text-white"}`} />
                        {sidebarOpen && (
                          <span className="ml-3">{item.name}</span>
                        )}
                        {hasNotification && (
                          <Badge 
                            variant="destructive" 
                            className={`h-5 w-5 p-0 flex items-center justify-center bg-red-500 border-none absolute ${
                              sidebarOpen ? "-right-1 top-1/2 -translate-y-1/2" : "-top-1 -right-1"
                            }`}
                          >
                            {item.name === "Messages" ? unreadMessages : unreadNotifications}
                          </Badge>
                        )}
                    </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User menu and logout */}
          <div className="border-t border-white/10 mt-auto">
            <div className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`w-full flex items-center ${!sidebarOpen ? "justify-center" : "justify-start"} gap-2 px-2 text-white hover:bg-white/20`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-white/10 text-white">{getFullName()?.charAt(0)}</AvatarFallback>
                          </Avatar>
                    {sidebarOpen && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate text-white">{getFullName()}</p>
                        <p className="text-xs text-white/90 truncate">{user?.email}</p>
                      </div>
                    )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white shadow-md border-0">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/mood-mentor-dashboard/profile")}>
                          <User className="mr-2 h-4 w-4" />View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/mood-mentor-dashboard/profile/edit")}>
                          <Edit className="mr-2 h-4 w-4" />Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/mood-mentor-dashboard/settings")}>
                          <Settings className="mr-2 h-4 w-4" />Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
            <Button 
              variant="ghost" 
              className={`w-full flex items-center justify-center text-white hover:bg-white/20 p-4 ${
                sidebarOpen ? "justify-start px-6" : "justify-center"
              }`}
              onClick={handleSignout}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Sign out</span>}
            </Button>
            <div className="h-4"></div> {/* Space after signout */}
          </div>
        </div>
      </aside>

      {/* Compact Header - Only shows outside sidebar */}
      <header className={cn(
        "fixed top-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200",
        "transition-all duration-300",
        sidebarOpen ? "left-64" : "left-20"
      )}>
        <div className="h-16 flex items-center justify-between px-4">
          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchResults.length > 0) {
                handleSearchResultClick(searchResults[0].href);
              }
            }} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search dashboard..."
                className="w-full pl-10 pr-4 rounded-full border-gray-200 bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => setIsSearchOpen(searchQuery.length > 0)}
              />
            </form>

            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[400px] overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {Object.entries(
                      searchResults.reduce((acc, item) => {
                        acc[item.category] = [...(acc[item.category] || []), item];
                        return acc;
                      }, {} as Record<string, SearchResult[]>)
                    ).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                          {category}
                        </div>
                        {items.map((item) => (
                          <button
                            key={item.href}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                            onClick={() => handleSearchResultClick(item.href)}
                          >
                            {item.icon && <item.icon className="h-4 w-4 text-gray-500" />}
                            <div>
                              <div className="text-sm font-medium">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500">{item.description}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications and Messages */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => navigate('/mood-mentor-dashboard/notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white">{unreadNotifications}</span>
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => navigate('/mood-mentor-dashboard/messages')}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-white">{unreadMessages}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto py-4 px-4 sm:px-6 lg:px-8",
        "pt-20", // Add padding for header
        "transition-all duration-200 ease-in-out",
        "bg-gray-50",
        sidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="bg-white shadow-md border-0">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.content}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardLayout;
