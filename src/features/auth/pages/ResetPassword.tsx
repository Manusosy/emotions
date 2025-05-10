import { useState, useEffect } from 'react';
import { KeyRound, Check } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { PasswordInput } from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '@/hooks/use-auth';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; token?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setErrors({ token: 'Reset token is missing. Please check your reset link.' });
    }
  }, [location.search]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string; token?: string } = {};
    let isValid = true;

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!token) {
      newErrors.token = 'Reset token is missing';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const success = await resetPassword(token, password);
      if (success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrors({ token: 'Something went wrong. The token may be invalid or expired.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Set New Password" 
      subtitle="Create a new password for your account"
      icon={<KeyRound className="w-6 h-6" />}
    >
      {isSubmitted ? (
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-600">Password Reset Successful!</p>
          <p className="text-gray-600">
            Your password has been reset successfully. You can now use your new password to sign in.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.token && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.token}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="Enter new password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput 
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="Confirm new password"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading || !!errors.token}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Reset Password
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="text-primary font-medium hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthLayout>
  );
} 