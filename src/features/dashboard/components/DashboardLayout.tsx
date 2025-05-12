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
  LayoutDashboard,
  MessageCircle,
  Smile
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
import EmotionalWellnessButton from "./EmotionalWellnessButton";
import { UserRole, User as UserType } from "@/types/database.types";

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
  const { user, signout, isAuthenticated, getFullName } = useAuth();
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

  // Update the mock data initialization to remove fake notification counts
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
    setUnreadNotifications(0); // Set to 0 instead of counting unread
    setUnreadMessages(0); // Set to 0 instead of hardcoded 1
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

  // Handle search input - Update the function to manage the dropdown
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setIsSearchOpen(value.length > 0);
    
    if (!value) {
      setSearchResults([]);
      return;
    }

    const filteredResults = searchableItems.filter(item => 
      item.title.toLowerCase().includes(value.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(value.toLowerCase()))
    );
    setSearchResults(filteredResults);
  };

  // Handle keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(prevState => !prevState);
        if (!isSearchOpen) {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          searchInput?.focus();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isSearchOpen]);

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

  // Handle search result click
  const handleSearchResultClick = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar/Navigation - Updated with collapsible functionality */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-gray-100 bg-white transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden lg:overflow-visible",
          "lg:static lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header with logo and toggle button */}
          <div className="flex items-center h-16 px-6 border-b border-gray-100 bg-white justify-between">
            <Link to="/patient-dashboard" className="flex items-center gap-2">
              {sidebarOpen ? (
                <img 
                  src="/assets/emotions-logo-black.png" 
                  alt="Emotions Logo" 
                  className="h-9 w-auto"
                />
              ) : (
                <Brain className="h-7 w-7 text-blue-600" />
              )}
            </Link>
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:flex hidden text-gray-500 hover:bg-gray-100"
              >
                <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
              </Button>
            )}
            {isMobile && sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Add Emotional Wellness Check-in Button - Only show in expanded view */}
          {sidebarOpen && (
            <div className="px-4 pt-5 pb-3">
              <EmotionalWellnessButton />
            </div>
          )}

          {/* Sidebar navigation with sections */}
          <div className="flex-1 overflow-y-auto py-4">
            {patientNavigation.map((section) => (
              <div key={section.section} className="mb-4">
                {sidebarOpen && (
                  <h3 className="px-4 mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                    const hasNotification = 
                      (item.name === "Messages" && unreadMessages > 0) ||
                      (item.name === "Notifications" && unreadNotifications > 0);
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center ${sidebarOpen ? 'px-4' : 'justify-center'} py-2.5 mx-2 text-[15px] font-medium rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-600 hover:bg-slate-50"
                        } relative`}
                        onClick={() => isMobile && setSidebarOpen(false)}
                      >
                        <item.icon className={`${sidebarOpen ? 'mr-3' : ''} h-5 w-5 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                        {sidebarOpen && <span>{item.name}</span>}
                        
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
          </div>

          {/* Sidebar footer with sign out button only */}
          <div className="mt-auto border-t border-gray-100 bg-white">
            <div className="p-4">
              {/* Sign Out Button - Always visible */}
              <Button
                variant="outline"
                size={sidebarOpen ? "default" : "icon"}
                className={`${sidebarOpen ? "justify-start w-full" : "mx-auto"} text-red-600 hover:text-red-700 hover:bg-red-50`}
                onClick={handleSignout}
              >
                <LogOut className={`${sidebarOpen ? "mr-2" : ""} h-4 w-4`} />
                {sidebarOpen && "Sign out"}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header - Updated to adjust based on sidebar state */}
        <header className={cn(
          "sticky top-0 z-10 h-16 border-b border-gray-100 bg-white",
          "transition-all duration-300",
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        )}>
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            {/* Mobile menu button - Only show on mobile */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            {/* Left spacer for centering on desktop */}
            <div className="w-56 hidden lg:block"></div>
            
            {/* Centered Search Bar */}
            <div ref={searchRef} className="relative w-full max-w-md mx-auto">
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
                        }, {} as Record<string, typeof searchResults>)
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
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative"
                  >
                    <Bell className="h-5 w-5 text-slate-700" />
                    {unreadNotifications > 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-white">{unreadNotifications}</span>
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" ref={notificationRef}>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500">
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <div>
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors ${
                              !notification.read ? "bg-blue-50" : ""
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notification.read ? "text-blue-900" : "text-slate-900"}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {notification.content}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-1.5"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t text-center">
                    <Button variant="link" size="sm" className="text-blue-600" onClick={() => navigate('/patient-dashboard/notifications')}>
                      View all notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Messages */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/patient-dashboard/messages')}
              >
                <MessageCircle className="h-5 w-5 text-slate-700" />
                {unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white">{unreadMessages}</span>
                  </div>
                )}
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full hover:bg-slate-100 p-0 h-10 w-10">
                    <Avatar className="h-8 w-8 border border-slate-200">
                      <AvatarImage src={user?.avatar_url || ''} alt={user?.email || 'User'} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                  <DropdownMenuItem onClick={handleSignout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto dashboard-content",
          "transition-all duration-200 ease-in-out"
        )}>
          <Stabilizer>
            <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </Stabilizer>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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