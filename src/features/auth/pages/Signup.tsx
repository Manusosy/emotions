import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { PatientSignupForm } from '../components/patient/PatientSignupForm';
import { MentorSignupForm } from '../components/mentor/MentorSignupForm';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/database.types';
import { Link } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ role?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(params.role === 'mentor' ? 'mood_mentor' : 'patient');
  const { signup, isAuthenticated, userRole } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      navigate(getDashboardPath(userRole));
    }
  }, [isAuthenticated, userRole, navigate]);
  
  // Handle URL changes to update active role
  useEffect(() => {
    if (params.role === 'mentor') {
      setActiveRole('mood_mentor');
    } else {
      setActiveRole('patient');
    }
  }, [params.role]);
  
  // Helper to get dashboard path based on role
  const getDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'patient':
        return '/patient-dashboard';
      case 'mood_mentor':
        return '/mood-mentor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/';
    }
  };
  
  // Handle signup form submission
  const handleSignup = async (formData: any) => {
    setIsLoading(true);
    try {
      // Map internal roles to API roles
      const success = await signup(formData, activeRole);
      if (success) {
        // Redirect to dashboard based on role
        navigate(getDashboardPath(activeRole));
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine title based on active role
  const getTitle = (): string => {
    return activeRole === 'mood_mentor' ? 'Become a Mood Mentor' : 'Create Patient Account';
  };
  
  // Determine subtitle based on active role
  const getSubtitle = (): string => {
    return activeRole === 'mood_mentor' 
      ? 'Sign up to become a mood mentor and help others with their emotional well-being'
      : 'Create an account to start your emotional wellness journey';
  };

  return (
    <AuthLayout 
      title={getTitle()} 
      subtitle={getSubtitle()}
      icon={<UserPlus className="w-6 h-6" />}
    >
      {activeRole === 'mood_mentor' ? (
        <MentorSignupForm 
          onSubmit={handleSignup}
          isLoading={isLoading} 
        />
      ) : (
        <>
        <PatientSignupForm 
          onSubmit={handleSignup}
          isLoading={isLoading}
        />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Are you a mood mentor? <Link to="/signup/mentor" className="font-semibold text-primary hover:underline">Sign up here</Link>
            </p>
          </div>
        </>
      )}
    </AuthLayout>
  );
}