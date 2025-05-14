import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MoodTracker from "@/features/mood-tracking/pages/MoodTracker";
import NotFound from "./pages/NotFound";
import Journal from "@/pages/Journal";
import DashboardJournalPage from "@/features/dashboard/pages/JournalPage";
import NotificationsPage from "@/features/dashboard/pages/NotificationsPage";
import MoodMentorNotificationsPage from "@/features/mood-mentors/pages/NotificationsPage";
import MoodTrackerPage from "@/features/dashboard/pages/MoodTrackerPage";
import ReportsPage from "@/features/dashboard/pages/ReportsPage";
import Footer from "@/components/layout/Footer";
import ContactBanner from "@/components/layout/ContactBanner";
import MoodMentors from "@/features/mood-mentors/pages/MoodMentors";
import MoodMentorAppointmentsPage from "@/features/mood-mentors/pages/AppointmentsPage";
import PatientsPage from "@/features/mood-mentors/pages/PatientsPage";
import GroupsPage from "@/features/mood-mentors/pages/GroupsPage";
import MoodMentorResourcesPage from "@/features/mood-mentors/pages/ResourcesPage";
import DashboardResourcesPage from "@/features/dashboard/pages/ResourcesPage";
import BookingPage from "@/features/booking/pages/BookingPage";
import PatientDashboard from "@/features/dashboard/pages/PatientDashboard";
import PatientAppointmentsPage from "@/features/dashboard/pages/AppointmentsPage";
import FavoritesPage from "@/features/dashboard/pages/FavoritesPage";
import Settings from "@/features/dashboard/pages/Settings";
import Profile from "@/features/dashboard/pages/Profile";
import DeleteAccount from "@/features/dashboard/pages/DeleteAccount";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import ComingSoon from '@/components/ComingSoon';
import MoodMentorDashboard from "@/features/mood-mentors/pages/MoodMentorDashboard";
import Header from "@/app/layout/Header";
import Resources from "@/pages/Resources";
import HelpGroups from "./pages/HelpGroups";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataProtection from "./pages/DataProtection";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import About from "./pages/About";
import MoodMentorProfile from "@/features/mood-mentors/pages/MoodMentorProfile";
import ReviewsPage from "@/features/mood-mentors/pages/ReviewsPage";
import AvailabilityPage from "@/features/mood-mentors/pages/AvailabilityPage";
import './styles/App.css';
import { Spinner } from "@/components/ui/spinner";
import JournalEntryPage from "@/features/journal/pages/JournalEntryPage";
import NewJournalEntryPage from "@/features/journal/pages/NewJournalEntryPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import HelpCenterPage from "@/features/dashboard/pages/HelpCenterPage";
import MessagesPage from "@/features/dashboard/pages/MessagesPage";
import MoodMentorMessagesPage from "@/features/mood-mentors/pages/MessagesPage";
import ScrollToTop from "@/components/layout/ScrollToTop";
import DeleteAccountPage from "@/features/mood-mentors/pages/DeleteAccountPage";
import { profileService } from "@/lib/profileService";
import { moodMentorService } from "@/lib/moodMentorService";
import { Login, Signup, ForgotPassword, ResetPassword } from '@/features/auth/pages';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/database.types';
import { devLog, errorLog } from '@/utils/environment';
import { DiagnosticTool } from '@/components/DiagnosticTool';
import { setupDatabase } from '@/lib/database-setup';
import ProfileEditPage from "@/features/mood-mentors/pages/ProfileEditPage";
import SettingsPage from "@/features/mood-mentors/pages/SettingsPage";
import ProfilePage from "@/features/mood-mentors/pages/ProfilePage";

// Type definition for ProtectedRoute props
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
}

const HomePage = () => {
  return (
    <div className="homepage-wrapper relative pb-12">
      <MoodTracker />
    </div>
  );
};

// DashboardErrorFallback component to provide context-aware error handling
const DashboardErrorFallback = ({ dashboardType }: { dashboardType: 'patient' | 'mood_mentor' }) => {
  const navigate = useNavigate();
  const dashboardPath = dashboardType === 'patient' ? '/patient-dashboard' : '/mood-mentor-dashboard';
  
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-6 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Something went wrong</h2>
        <p className="text-gray-600">
          We encountered an error while loading this page.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="outline" onClick={() => navigate(dashboardPath)}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredRole,
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, userRole, isLoading, getDashboardUrlForRole } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const effectiveAllowedRoles = requiredRole ? [requiredRole] : allowedRoles;

  useEffect(() => {
    const checkAuth = async () => {
      // Wait until authentication check is complete
      if (isLoading) return;

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        devLog("User not authenticated, redirecting to login");
        const loginPath = `/login?redirect=${encodeURIComponent(pathname)}`;
        navigate(loginPath, { replace: true });
        return;
      }

      // Check if user has the required role
      const hasRequiredRole =
        effectiveAllowedRoles.length === 0 || (userRole && effectiveAllowedRoles.includes(userRole as UserRole));

      if (!hasRequiredRole) {
        devLog(`User does not have required role. Current role: ${userRole}, required roles:`, effectiveAllowedRoles);
        // Redirect to appropriate dashboard based on role
        const dashboardPath = getDashboardUrlForRole(userRole);
        navigate(dashboardPath, { replace: true });
        return;
      }

      // User is authenticated and authorized
      devLog("User authorized for route:", pathname);
      setIsAuthorized(true);
    };

    checkAuth();
  }, [isAuthenticated, userRole, pathname, effectiveAllowedRoles, navigate, isLoading, getDashboardUrlForRole]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  // Wrap the children in an ErrorBoundary with the appropriate dashboard path
  const dashboardPath = requiredRole ? getDashboardUrlForRole(requiredRole) : '/';
  
  return isAuthorized ? (
    <ErrorBoundary dashboardPath={dashboardPath}>
      {children}
    </ErrorBoundary>
  ) : null;
};

const AppContent = () => {
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isAnchor = target.tagName === 'A' || target.closest('a');
      if (isAnchor) {
        devLog("Link clicked:", target);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    devLog("Current location:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const pathname = location.pathname;
    const isDashboardPage = pathname.includes('dashboard') || 
                          pathname.includes('admin') ||
                          pathname === '/mood-mentor-dashboard' ||
                          pathname.startsWith('/mood-mentor-dashboard/');
    
    setShowHeaderFooter(!isDashboardPage);
    devLog('Current path:', pathname, 'Show header/footer:', !isDashboardPage);
  }, [location.pathname]);

  const shouldShowContactBanner = location.pathname === "/" || 
                                 location.pathname === "/contact" || 
                                 location.pathname === "/privacy" ||
                                 location.pathname === "/data-protection" ||
                                 location.pathname === "/terms" ||
                                 location.pathname === "/faqs" ||
                                 location.pathname === "/about";

  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Always show DiagnosticTool for easy access to fix connection issues */}
        <DiagnosticTool />
        
        <div className="flex flex-col min-h-screen max-w-[100vw] overflow-x-hidden">
          {showHeaderFooter && <Navbar />}
          <div className="flex-grow">
            <Routes key={location.pathname}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              
              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/login/:role" element={<Login />} />
              <Route path="/signup" element={<Navigate to="/signup/patient" replace />} />
              <Route path="/signup/:role" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route path="/journal" element={<Journal />} />
              <Route path="/mood-mentors" element={<MoodMentors />} />
              <Route path="/mood-mentors/:id" element={<MoodMentorProfile />} />
              <Route path="/booking" element={<BookingPage />} />
              
              <Route path="/resources" element={<Resources />} />
              <Route path="/help-groups" element={<HelpGroups />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/data-protection" element={<DataProtection />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/about" element={<About />} />
              
              {/* Mood Mentor Dashboard Routes */}
              <Route path="/mood-mentor-dashboard" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <MoodMentorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/appointments" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <MoodMentorAppointmentsPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/patients" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <PatientsPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/groups" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <GroupsPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/resources" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <MoodMentorResourcesPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/reviews" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <ReviewsPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/availability" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <AvailabilityPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/messages" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <MoodMentorMessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/profile" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/profile/edit" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <ProfileEditPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/settings" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/settings/delete-account" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <DeleteAccountPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/notifications" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <MoodMentorNotificationsPage />
                </ProtectedRoute>
              } />
              <Route path="/mood-mentor-dashboard/*" element={
                <ProtectedRoute requiredRole="mood_mentor">
                  <NotFound />
                </ProtectedRoute>
              } />
              
              {/* Patient Dashboard Routes */}
              <Route path="/patient-dashboard" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } /> 
              <Route path="/patient-dashboard/appointments" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientAppointmentsPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/favorites" element={
                <ProtectedRoute requiredRole="patient">
                  <FavoritesPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/journal" element={
                <ProtectedRoute requiredRole="patient">
                  <DashboardJournalPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/journal/:entryId" element={
                <ProtectedRoute requiredRole="patient">
                  <JournalEntryPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/journal/new" element={
                <ProtectedRoute requiredRole="patient">
                  <NewJournalEntryPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/journal/edit/:entryId" element={
                <ProtectedRoute requiredRole="patient">
                  <ComingSoon title="Edit Journal Entry" />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/notifications" element={
                <ProtectedRoute requiredRole="patient">
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/mood-tracker" element={
                <ProtectedRoute requiredRole="patient">
                  <MoodTrackerPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/reports" element={
                <ProtectedRoute requiredRole="patient">
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/resources" element={
                <ProtectedRoute requiredRole="patient">
                  <DashboardResourcesPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/messages" element={
                <ProtectedRoute requiredRole="patient">
                  <MessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/help" element={
                <ProtectedRoute requiredRole="patient">
                  <HelpCenterPage />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/settings" element={
                <ProtectedRoute requiredRole="patient">
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/settings/delete-account" element={
                <ProtectedRoute requiredRole="patient">
                  <DeleteAccount />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/profile" element={
                <ProtectedRoute requiredRole="patient">
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/patient-dashboard/*" element={
                <ProtectedRoute requiredRole="patient">
                  <NotFound />
                </ProtectedRoute>
              } />
              
              {/* Fallback 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          
          {showHeaderFooter && (
            <>
              {shouldShowContactBanner && (
                <div className="mb-12">
                  <ContactBanner />
                </div>
              )}
              <Footer />
            </>
          )}
        </div>
      </TooltipProvider>
    </>
  );
};

const App = () => {
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the database tables - wrap in try/catch and add timeout
        console.log("Initializing application...");
        
        // Add a timeout to prevent hanging on initialization
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timeout')), 5000);
        });
        
        // Race the initialization with the timeout
        try {
          await Promise.race([
            setupDatabase(),
            timeoutPromise
          ]);
        } catch (dbError) {
          console.warn("Database initialization error or timeout:", dbError);
          // Continue anyway - don't block app startup for DB issues
        }
        
        // Mark initialization as complete even if database setup failed
        setIsMounting(false);
      } catch (error) {
        console.error("Error during initialization:", error);
        toast.error("Application initialization error");
        setIsMounting(false);
      }
    };

    initialize();
    
    // Set a backup timeout in case initialization hangs
    const backupTimeout = setTimeout(() => {
      if (isMounting) {
        console.warn("Initialization timeout reached, forcing app to start anyway");
        setIsMounting(false);
      }
    }, 7000);
    
    return () => clearTimeout(backupTimeout);
  }, []);

  // Show a loading screen until initialization is complete
  if (isMounting) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-lg font-medium">Initializing application...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              We're sorry, but there was an error loading the application. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
};

export default App;
