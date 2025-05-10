# Frontend Component Setup Guide

This guide focuses on the detailed implementation of key frontend components for the patient and mood mentor authentication flows.

## Table of Contents
- [Shared Components](#shared-components)
- [Patient Components](#patient-components)
- [Mood Mentor Components](#mood-mentor-components)
- [Dashboard Components](#dashboard-components)

## Shared Components

### AuthLayout Component

This component provides consistent layout for all authentication pages:

```tsx
// src/features/auth/components/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Emotions App" className="h-10 w-auto" />
          </Link>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          {icon && <div className="text-primary">{icon}</div>}
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        
        {subtitle && (
          <p className="text-gray-600 mb-6">{subtitle}</p>
        )}
        
        {children}
      </div>
    </div>
  );
}
```

### PasswordInput Component

Reusable password input with toggle visibility:

```tsx
// src/features/auth/components/PasswordInput.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
}

export function PasswordInput({ id, value, onChange, placeholder = "Enter password", error }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pr-10 ${error ? "border-red-500" : ""}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </Button>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
```

### AuthFooter Component

```tsx
// src/features/auth/components/shared/AuthFooter.tsx
import { Link } from "react-router-dom";

interface AuthFooterProps {
  linkText: string;
  linkHref: string;
  mainText: string;
}

export function AuthFooter({ linkText, linkHref, mainText }: AuthFooterProps) {
  return (
    <div className="text-center mt-6">
      <p className="text-sm text-gray-600">
        {mainText} <Link to={linkHref} className="text-primary font-medium hover:underline">{linkText}</Link>
      </p>
    </div>
  );
}
```

## Patient Components

### PatientSignupForm

```tsx
// src/features/auth/components/patient/PatientSignupForm.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PasswordInput } from "../PasswordInput";
import { Link } from "react-router-dom";
import { countries } from "../../utils/countries";
import { passwordValidator } from "@/utils/validation";
import { Spinner } from "@/components/ui/spinner";

interface PatientSignupFormProps {
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

export function PatientSignupForm({ onSubmit, isLoading }: PatientSignupFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }
    
    // Password validation
    const passwordCheck = passwordValidator(formData.password);
    if (!passwordCheck.valid) {
      newErrors.password = passwordCheck.message;
      isValid = false;
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    // Country validation
    if (!formData.country) {
      newErrors.country = "Country is required";
      isValid = false;
    }
    
    // Terms agreement
    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput 
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          error={errors.password}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput 
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          error={errors.confirmPassword}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
          <SelectTrigger className={errors.country ? "border-red-500" : ""}>
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
      </div>
      
      <div className="flex items-start space-x-2 pt-2">
        <Checkbox 
          id="terms" 
          checked={agreedToTerms} 
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          className={errors.terms ? "border-red-500" : ""}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
          {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
        Create Patient Account
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login/patient" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
```

### PatientLoginForm

```tsx
// src/features/auth/components/patient/PatientLoginForm.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "../PasswordInput";
import { Link } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";

interface PatientLoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export function PatientLoginForm({ onSubmit, isLoading }: PatientLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onSubmit(email, password);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput 
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
        Sign In
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup/patient" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          Are you a Mood Mentor?{" "}
          <Link to="/login/mentor" className="text-primary font-medium hover:underline">
            Log in as Mood Mentor
          </Link>
        </p>
      </div>
    </form>
  );
}
```

## Mood Mentor Components

### MentorSignupForm

```tsx
// src/features/auth/components/mentor/MentorSignupForm.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "../PasswordInput";
import { Link } from "react-router-dom";
import { countries } from "../../utils/countries";
import { passwordValidator } from "@/utils/validation";
import { Spinner } from "@/components/ui/spinner";

interface MentorSignupFormProps {
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
}

export function MentorSignupForm({ onSubmit, isLoading }: MentorSignupFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    gender: "",
    speciality: "",
    bio: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Basic validations similar to patient form
    // ...

    // Additional Mentor-specific validations
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
      isValid = false;
    }
    
    if (!formData.speciality) {
      newErrors.speciality = "Speciality is required";
      isValid = false;
    }
    
    if (!formData.bio || formData.bio.length < 50) {
      newErrors.bio = "Bio must be at least 50 characters";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic fields similar to patient form */}
      {/* ... */}
      
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
          <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
        {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="speciality">Speciality</Label>
        <Select value={formData.speciality} onValueChange={(value) => setFormData({...formData, speciality: value})}>
          <SelectTrigger className={errors.speciality ? "border-red-500" : ""}>
            <SelectValue placeholder="Select your speciality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anxiety">Anxiety</SelectItem>
            <SelectItem value="depression">Depression</SelectItem>
            <SelectItem value="stress">Stress Management</SelectItem>
            <SelectItem value="trauma">Trauma</SelectItem>
            <SelectItem value="relationships">Relationships</SelectItem>
            <SelectItem value="general">General Mental Health</SelectItem>
          </SelectContent>
        </Select>
        {errors.speciality && <p className="text-red-500 text-sm">{errors.speciality}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">Professional Bio</Label>
        <Textarea 
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          placeholder="Tell us about your experience and approach (minimum 50 characters)"
          className={errors.bio ? "border-red-500" : ""}
          rows={4}
        />
        {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
        <p className="text-xs text-gray-500">
          {formData.bio.length} / 50 minimum characters
        </p>
      </div>
      
      {/* Terms and submit button similar to patient form */}
      {/* ... */}
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
        Create Mood Mentor Account
      </Button>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login/mentor" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
```

### MentorLoginForm

Similar to the PatientLoginForm with appropriate text changes:

```tsx
// src/features/auth/components/mentor/MentorLoginForm.tsx
// Similar to PatientLoginForm, but with mentor-specific text
// ...

<div className="text-center mt-2">
  <p className="text-sm text-gray-600">
    Are you a patient?{" "}
    <Link to="/login/patient" className="text-primary font-medium hover:underline">
      Log in as Patient
    </Link>
  </p>
</div>
```

## Dashboard Components 

### PatientDashboardLayout

```tsx
// src/features/patient/components/PatientDashboardLayout.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  BarChart, 
  Heart, 
  Settings, 
  LogOut 
} from "lucide-react";

interface PatientDashboardLayoutProps {
  children: React.ReactNode;
}

export default function PatientDashboardLayout({ children }: PatientDashboardLayoutProps) {
  const location = useLocation();
  const { user, signout } = useAuth();
  
  const navigation = [
    { name: "Home", href: "/patient-dashboard", icon: Home },
    { name: "Appointments", href: "/patient-dashboard/appointments", icon: Calendar },
    { name: "Messages", href: "/patient-dashboard/messages", icon: MessageSquare },
    { name: "Mood Tracking", href: "/patient-dashboard/mood", icon: BarChart },
    { name: "Wellness", href: "/patient-dashboard/wellness", icon: Heart },
    { name: "Settings", href: "/patient-dashboard/settings", icon: Settings },
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center p-6 border-b">
            <Link to="/" className="flex items-center">
              <img src="/logo.svg" alt="Emotions App" className="h-8 w-auto" />
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <Avatar className="h-8 w-8 mr-2">
                <img
                  src={user?.avatar_url || "https://ui-avatars.com/api/?name=" + user?.full_name}
                  alt={user?.full_name || "User"}
                />
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={signout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### MentorDashboardLayout

Similar to the PatientDashboardLayout but with mentor-specific navigation items.

## Adding Icons and Assets

Create custom icons for the new Mood Mentor branding:

```tsx
// src/components/icons.tsx
import { LucideProps } from "lucide-react";

export function PatientIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function MentorIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
``` 