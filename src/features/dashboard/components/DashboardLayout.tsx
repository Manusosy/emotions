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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative left-0 top-0 z-20 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:translate-x-0`}
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
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Topbar */}
        <div className="relative flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="hidden md:block ml-4 flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 py-1.5 border-gray-300"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white shadow-lg rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                  <Command>
                    <CommandList>
                      <CommandInput placeholder="Type to search..." />
                      <CommandEmpty>No results found.</CommandEmpty>
                      {searchResults.reduce((acc, result) => {
                        const category = result.category;
                        const existing = acc.find((group) => group.category === category);
                        if (existing) {
                          existing.items.push(result);
                        } else {
                          acc.push({ category, items: [result] });
                        }
                        return acc;
                      }, [] as { category: string; items: SearchResult[] }[]).map((group) => (
                        <CommandGroup key={group.category} heading={group.category}>
                          {group.items.map((result) => (
                            <CommandItem
                              key={result.href}
                              onSelect={() => handleSearchResultClick(result.href)}
                              className="flex items-center"
                            >
                              {result.icon && <result.icon className="mr-2 h-4 w-4 text-gray-400" />}
                              <div>
                                <div>{result.title}</div>
                                {result.description && (
                                  <div className="text-xs text-gray-500">{result.description}</div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-1 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 z-10">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          // Mark all as read
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          setUnreadNotifications(0);
                        }}
                      >
                        Mark all as read
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notification.content}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {formatTime(notification.created_at)}
                              </div>
                            </div>
                            {!notification.read && (
                              <div className="ml-2 flex-shrink-0">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-center text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigate('/patient-dashboard/notifications');
                        setNotificationOpen(false);
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.full_name || user?.email}</span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
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
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {children}
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