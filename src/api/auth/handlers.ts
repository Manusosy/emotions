import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { JWT_SECRET, RATE_LIMIT_WINDOW_MS, MAX_LOGIN_ATTEMPTS, getJwtExpiryInSeconds } from '@/utils/env';

// In-memory storage for users (in a real app, use a database)
// This is just for demo purposes
let users: any[] = [
  // Initial test users
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    firstName: 'Patient',
    lastName: 'Test',
    email: 'patient@example.com',
    // Password: Test123!
    password: '$2a$10$XkftUZBMaWnGlE8XgUiHHu9WOWzgFCYVPObDCTNq8wdOawNkC1A2K',
    role: 'patient',
    country: 'United States',
    created_at: '2023-08-01T00:00:00.000Z',
    avatar_url: null
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    firstName: 'Mentor',
    lastName: 'Test',
    email: 'mentor@example.com',
    // Password: Test123!
    password: '$2a$10$XkftUZBMaWnGlE8XgUiHHu9WOWzgFCYVPObDCTNq8wdOawNkC1A2K',
    role: 'moodMentor',
    country: 'United Kingdom',
    gender: 'Female',
    speciality: 'Anxiety',
    bio: 'A professional therapist with over 10 years of experience helping patients manage anxiety and stress through mindfulness techniques.',
    created_at: '2023-07-15T00:00:00.000Z',
    avatar_url: null
  }
];
let tokens: Record<string, string> = {}; // userId -> token
let resetTokens: Record<string, { token: string, email: string, expiry: number }> = {};

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const patientRegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  country: z.string().min(1),
});

const mentorRegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  country: z.string().min(1),
  gender: z.string().min(1),
  speciality: z.string().min(1),
  bio: z.string().min(50),
});

// Rate limiting (simple implementation)
const RATE_LIMIT_WINDOW = RATE_LIMIT_WINDOW_MS; // 1 minute
const MAX_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
const ipAttempts: Record<string, { count: number, resetTime: number }> = {};

// Helper function to check rate limiting
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  
  if (!ipAttempts[ip]) {
    ipAttempts[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return true;
  }
  
  if (now > ipAttempts[ip].resetTime) {
    // Reset window
    ipAttempts[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return true;
  }
  
  if (ipAttempts[ip].count >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }
  
  // Increment attempts
  ipAttempts[ip].count += 1;
  return true;
};

// Create JWT token
const createToken = (userId: string, role: string): string => {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: getJwtExpiryInSeconds() });
};

// Validate token
export async function validateToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string, role: string };
    
    // Check if token is in active tokens list
    if (!tokens[decoded.sub] || tokens[decoded.sub] !== token) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    // Find user
    const user = users.find(u => u.id === decoded.sub);
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      isValid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: `${user.firstName} ${user.lastName}`,
        first_name: user.firstName,
        last_name: user.lastName,
        created_at: user.created_at,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}

// Patient login handler
export async function patientLogin(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      // If result is not successful, we know it's a SafeParseError
      const errorResult = result as z.SafeParseError<typeof loginSchema>;
      return NextResponse.json({ message: 'Invalid input', errors: errorResult.error.format() }, { status: 400 });
    }
    
    const { email, password } = result.data;
    
    // Find user
    const user = users.find(u => u.email === email && u.role === 'patient');
    
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Create token
    const token = createToken(user.id, user.role);
    
    // Store token
    tokens[user.id] = token;
    
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: `${user.firstName} ${user.lastName}`,
        first_name: user.firstName,
        last_name: user.lastName,
        created_at: user.created_at,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Patient login error:', error);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}

// Mood mentor login handler
export async function mentorLogin(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      // If result is not successful, we know it's a SafeParseError
      const errorResult = result as z.SafeParseError<typeof loginSchema>;
      return NextResponse.json({ message: 'Invalid input', errors: errorResult.error.format() }, { status: 400 });
    }
    
    const { email, password } = result.data;
    
    // Find user
    const user = users.find(u => u.email === email && u.role === 'mood_mentor');
    
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Create token
    const token = createToken(user.id, user.role);
    
    // Store token
    tokens[user.id] = token;
    
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: `${user.firstName} ${user.lastName}`,
        first_name: user.firstName,
        last_name: user.lastName,
        created_at: user.created_at,
        avatar_url: user.avatar_url,
        speciality: user.speciality,
        bio: user.bio,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Mentor login error:', error);
    return NextResponse.json({ message: 'An error occurred during login' }, { status: 500 });
  }
}

// Patient registration handler
export async function patientRegister(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    console.log('Received registration request body:', body);
    
    // Validate input
    const result = patientRegisterSchema.safeParse(body);
    if (!result.success) {
      // If result is not successful, we know it's a SafeParseError
      const errorResult = result as z.SafeParseError<typeof patientRegisterSchema>;
      console.error('Validation error:', errorResult.error.format());
      return NextResponse.json({ message: 'Invalid input', errors: errorResult.error.format() }, { status: 400 });
    }
    
    const { firstName, lastName, email, password, confirmPassword, country } = result.data;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'patient',
      country,
      created_at: new Date().toISOString(),
      avatar_url: null
    };
    
    // Save user
    users.push(newUser);
    console.log('User created successfully:', newUser.id);
    
    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    return NextResponse.json({ 
      message: 'An error occurred during registration',
      error: error instanceof Error ? error.message : 'Unknown error'  
    }, { status: 500 });
  }
}

// Mood mentor registration handler
export async function mentorRegister(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate input
    const result = mentorRegisterSchema.safeParse(body);
    if (!result.success) {
      // If result is not successful, we know it's a SafeParseError
      const errorResult = result as z.SafeParseError<typeof mentorRegisterSchema>;
      return NextResponse.json({ message: 'Invalid input', errors: errorResult.error.format() }, { status: 400 });
    }
    
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      confirmPassword, 
      country,
      gender,
      speciality,
      bio
    } = result.data;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user - Use 'mood_mentor' role to match the UserRole type
    const newUser = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'mood_mentor',
      country,
      gender,
      speciality,
      bio,
      created_at: new Date().toISOString(),
      avatar_url: null
    };
    
    // Save user
    users.push(newUser);
    
    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Mentor registration error:', error);
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}

// Logout handler
export async function logout(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token to get user ID
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      
      // Remove token from active tokens
      if (tokens[decoded.sub]) {
        delete tokens[decoded.sub];
      }
    } catch (err) {
      // Invalid token, but we'll still return success
      console.error('Invalid token during logout:', err);
    }
    
    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'An error occurred during logout' }, { status: 500 });
  }
}

// Forgot password handler
export async function forgotPassword(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    
    const { email } = body;
    
    // Find user
    const user = users.find(u => u.email === email);
    
    if (!user) {
      // For security reasons, still return success even if user doesn't exist
      return NextResponse.json({ message: 'If your email is registered, you will receive a reset link' });
    }
    
    // Generate reset token
    const resetToken = uuidv4();
    
    // Store token with 1-hour expiry
    resetTokens[resetToken] = {
      token: resetToken,
      email: user.email,
      expiry: Date.now() + 3600000 // 1 hour
    };
    
    // In a real app, send email with reset link
    console.log(`Reset link for ${email}: /reset-password?token=${resetToken}`);
    
    return NextResponse.json({ message: 'If your email is registered, you will receive a reset link' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}

// Reset password handler
export async function resetPassword(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    if (!body.token || !body.password || typeof body.token !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
    }
    
    const { token, password } = body;
    
    // Validate token
    const resetData = resetTokens[token];
    
    if (!resetData || Date.now() > resetData.expiry) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }
    
    // Find user
    const userIndex = users.findIndex(u => u.email === resetData.email);
    
    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password
    users[userIndex].password = hashedPassword;
    
    // Remove used token
    delete resetTokens[token];
    
    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
} 