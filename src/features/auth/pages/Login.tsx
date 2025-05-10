import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { PatientLoginForm } from '../components/patient/PatientLoginForm';
import { MentorLoginForm } from '../components/mentor/MentorLoginForm';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/database.types';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ role?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(params.role === 'mentor' ? 'mood_mentor' : 'patient');
  const { signin, isAuthenticated, userRole, getDashboardUrlForRole } = useAuth();
  
  // Get redirect URL from query parameter or default to the appropriate dashboard
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const dashboardPath = getDashboardUrlForRole(userRole);
      navigate(redirectTo || dashboardPath);
    }
  }, [isAuthenticated, userRole, navigate, redirectTo, getDashboardUrlForRole]);
  
  // Handle URL changes to update active role
  useEffect(() => {
    if (params.role === 'mentor') {
      setActiveRole('mood_mentor');
    } else {
      setActiveRole('patient');
    }
  }, [params.role]);
  
  // Handle login form submission
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const success = await signin(email, password, activeRole);
      if (success) {
        navigate(redirectTo || getDashboardUrlForRole(activeRole));
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine title based on active role
  const getTitle = (): string => {
    return activeRole === 'mood_mentor' ? 'Mood Mentor Login' : 'Patient Login';
  };
  
  // Determine subtitle based on active role
  const getSubtitle = (): string => {
    return activeRole === 'mood_mentor' 
      ? 'Sign in to your mood mentor account to manage your profile and appointments'
      : 'Sign in to track your mood, journal, and connect with mood mentors';
  };
  
  return (
    <AuthLayout 
      title={getTitle()} 
      subtitle={getSubtitle()}
      icon={<LogIn className="w-6 h-6" />}
    >
      {activeRole === 'mood_mentor' ? (
        <MentorLoginForm 
          onSubmit={handleLogin}
          isLoading={isLoading} 
        />
      ) : (
        <PatientLoginForm 
          onSubmit={handleLogin}
          isLoading={isLoading}
        />
      )}
    </AuthLayout>
  );
} 