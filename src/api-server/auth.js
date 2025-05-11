// Convert file to TypeScript for better type safety
// Mock in-memory database for users
const users = [
  {
    id: '1',
    email: 'patient@example.com',
    password: 'Password123!', // In a real app, this would be hashed
    firstName: 'Patient',
    lastName: 'User',
    role: 'patient',
    createdAt: new Date().toISOString(),
    country: 'United States',
    gender: 'other'
  },
  {
    id: '2',
    email: 'mentor@example.com',
    password: 'Password123!', // In a real app, this would be hashed
    firstName: 'Mentor',
    lastName: 'User',
    role: 'mood_mentor',
    createdAt: new Date().toISOString(),
    country: 'Canada',
    gender: 'male'
  }
];

// Mock session storage
const sessions = [];

/**
 * Generate a simple mock session 
 */
const generateSession = (userId, role) => {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  const session = {
    id: sessionId,
    userId,
    role,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastActiveAt: new Date().toISOString()
  };
  
  // Add to sessions store
  sessions.push(session);
  
  return {
    id: sessionId,
    expiresAt: expiresAt.toISOString()
  };
};

// Validate required fields
const validateRegistrationData = (userData) => {
  const requiredFields = ['email', 'password', 'firstName', 'lastName', 'role', 'country'];
  const errors = {};
  
  requiredFields.forEach(field => {
    if (!userData[field]) {
      errors[field] = `${field} is required`;
    }
  });
  
  // Validate email format
  if (userData.email && !userData.email.includes('@')) {
    errors.email = 'Invalid email format';
  }
  
  // Validate password strength
  if (userData.password && userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Mock authentication service
export const mockAuthApi = {
  // Register a new user
  register: (userData, role) => {
    console.log('Mock API - Registering user:', { ...userData, password: '[REDACTED]' });
    
    // Validate input data
    const validationErrors = validateRegistrationData({...userData, role});
    if (validationErrors) {
      console.error('Validation errors:', validationErrors);
      return {
        success: false,
        error: { 
          message: 'Validation failed',
          details: validationErrors
        }
      };
    }
    
    // Check if email already exists
    if (users.find(user => user.email === userData.email)) {
      return {
        success: false,
        error: { message: 'Email already in use' }
      };
    }
    
    // Create new user
    const newUser = {
      id: Math.random().toString(36).substring(2, 15), // Simple ID generation
      email: userData.email,
      password: userData.password, // In a real app, you would hash this
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: role,
      createdAt: new Date().toISOString(),
      country: userData.country || 'Not specified',
      gender: userData.gender || null
    };
    
    // Add to "database"
    users.push(newUser);
    
    // Generate a session
    const session = generateSession(newUser.id, role);
    
    // Return success response with user data and session
    return {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName, 
          lastName: newUser.lastName,
          full_name: `${newUser.firstName} ${newUser.lastName}`
        },
        session
      }
    };
  },
  
  // Login user
  login: (email, password, role) => {
    console.log('Mock API - Login attempt:', email);
    
    // Basic input validation
    if (!email || !password) {
      return {
        success: false,
        error: { message: 'Email and password are required' }
      };
    }
    
    // Find user by email and role
    const user = users.find(user => 
      user.email === email && 
      (role ? user.role === role : true)
    );
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return {
        success: false,
        error: { message: 'Invalid email or password' }
      };
    }
    
    // Generate a session
    const session = generateSession(user.id, user.role);
    
    // Return success with user data and session
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          full_name: `${user.firstName} ${user.lastName}`
        },
        session
      }
    };
  },
  
  // Get current session
  getSession: (sessionId) => {
    console.log('Mock API - Getting session:', sessionId);
    
    if (!sessionId) {
      return {
        success: false,
        error: { message: 'No session ID provided' }
      };
    }
    
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return {
        success: false,
        error: { message: 'Session not found' }
      };
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return {
        success: false,
        error: { message: 'Session expired' }
      };
    }
    
    // Find the user
    const user = users.find(u => u.id === session.userId);
    
    if (!user) {
      return {
        success: false,
        error: { message: 'User not found' }
      };
    }
    
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          full_name: `${user.firstName} ${user.lastName}`
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      }
    };
  },
  
  // Logout - invalidate session
  logout: (sessionId) => {
    console.log('Mock API - Logging out session:', sessionId);
    
    if (!sessionId) {
      return {
        success: true,
        data: null
      };
    }
    
    // Remove session
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions.splice(sessionIndex, 1);
    }
    
    return {
      success: true,
      data: null
    };
  }
};

// Export mock API handlers
export default mockAuthApi; 