import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '@/hooks/use-auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const success = await forgotPassword(email);
      if (success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error sending reset link:', error);
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Reset Your Password" 
      subtitle="Enter your email and we'll send you a link to reset your password"
      icon={<KeyRound className="w-6 h-6" />}
    >
      {isSubmitted ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-lg font-semibold text-green-600">Password reset link sent!</p>
          <p className="text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>. Please check your email
            and follow the instructions to reset your password.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/login')} className="w-full">
              Return to Login
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Send Reset Link
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Remembered your password?{" "}
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