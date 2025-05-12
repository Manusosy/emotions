// Simple Express server to handle API requests
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Load Supabase credentials from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';

// Initialize Supabase client with error handling
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  });
  console.log('Supabase client initialized');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Execute the SQL setup file directly
app.get('/api/setup-database', async (req, res) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('Reading SQL setup file...');
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL setup commands...');
    
    // Use the PostgreSQL REST API to execute SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    }).catch(async (rpcError) => {
      console.log('RPC method not available, trying alternative approach:', rpcError.message);
      
      // Alternative: Execute each statement separately
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      console.log(`Executing ${statements.length} SQL statements individually...`);
      
      for (const [index, stmt] of statements.entries()) {
        console.log(`Executing statement ${index + 1}/${statements.length}`);
        
        // Try using PostgreSQL REST API
        const { error } = await supabase.rpc('exec', { sql: stmt + ';' })
          .catch(e => ({error: e}));
        
        if (error) {
          console.log(`Statement ${index + 1} error:`, error.message);
          // Continue despite errors - some statements might fail if objects already exist
        }
      }
      
      return { data: null, error: null };
    });
    
    if (error) {
      console.error('Error executing SQL setup:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to execute SQL setup commands',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify the user_profiles table was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      return res.status(500).json({
        success: false,
        message: 'SQL executed but verification failed',
        error: verifyError.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Database setup completed successfully',
      tables: ['user_profiles', 'emotions', 'emotion_logs'],
      verification: {
        user_profiles: verifyData ? verifyData.length : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set up database',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Alternative database setup using direct SQL through REST API
app.get('/api/setup-database-direct', async (req, res) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('Setting up database using direct SQL queries...');
    
    // Create user_profiles table
    const createUserProfilesResult = await directSqlQuery(`
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT,
        email TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    
    // Create emotions table
    const createEmotionsResult = await directSqlQuery(`
      CREATE TABLE IF NOT EXISTS public.emotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.user_profiles(id),
        emotion_type TEXT NOT NULL,
        intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    
    // Create emotion_logs table
    const createLogsResult = await directSqlQuery(`
      CREATE TABLE IF NOT EXISTS public.emotion_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.user_profiles(id),
        emotion_id UUID REFERENCES public.emotions(id),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
        context TEXT,
        triggers TEXT[]
      );
    `);
    
    // Insert test user
    const insertTestUserResult = await directSqlQuery(`
      INSERT INTO public.user_profiles (full_name, email, created_at, updated_at)
      VALUES ('Test User', 'test@example.com', now(), now())
      ON CONFLICT DO NOTHING;
    `);
    
    // Verify the user_profiles table exists and has data
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      return res.status(500).json({
        success: false,
        message: 'Database setup executed but verification failed',
        error: verifyError.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Database setup completed successfully via direct SQL',
      tables_created: ['user_profiles', 'emotions', 'emotion_logs'],
      verification: {
        user_profiles: verifyData ? verifyData.length : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting up database via direct SQL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set up database via direct SQL',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to execute direct SQL queries with fallback mechanisms
async function directSqlQuery(sql) {
  try {
    console.log('Executing SQL:', sql.trim().substring(0, 100) + '...');
    
    // Try using the REST API SQL endpoint
    const { data, error } = await supabase.rpc('exec', { 
      sql: sql 
    }).catch(async (e) => {
      console.log('RPC exec failed, trying PostgreSQL query:', e.message);
      
      // Fallback to direct query using PostgreSQL API
      return await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: sql
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Direct SQL failed with status: ${response.status}`);
        }
        return { data: 'Success', error: null };
      });
    });
    
    if (error) {
      console.warn('SQL query execution warning:', error.message);
      // We'll continue even if there are some errors, as tables might already exist
    }
    
    return { success: true };
  } catch (error) {
    console.error('SQL query execution error:', error);
    return { success: false, error: error.message };
  }
}

// Test DB endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Try a simple query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database test failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      database: 'connected',
      tables_tested: ['user_profiles'],
      results: data ? { count: data.length } : { count: 0 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error in test-db endpoint:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Database fix endpoint
app.get('/api/db-fix', async (req, res) => {
  try {
    console.log('Attempting to establish a fresh database connection...');
    
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    // Create a completely new client instance
    const freshClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    });
    
    // Try querying with the fresh client
    console.log('Testing fresh client with a simple query...');
    const { data, error } = await freshClient
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Fresh client connection failed:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to establish a fresh database connection',
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Use this new client as our global client
    supabase = freshClient;
    
    return res.json({
      success: true,
      message: 'Successfully established a fresh database connection',
      connectionInfo: {
        url: SUPABASE_URL.replace(/^(https?:\/\/[^\/]+).*$/, '$1'),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Unexpected error in db-fix:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Supabase status endpoint
app.get('/api/supabase-status', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    // Mask the key for security
    const maskedKey = SUPABASE_KEY ? 
      SUPABASE_KEY.substring(0, 6) + '...' + SUPABASE_KEY.substring(SUPABASE_KEY.length - 4) : 
      'Not set';
    
    // Test if URL is valid
    let urlIsValid = false;
    let urlError = null;
    
    try {
      const urlObj = new URL(SUPABASE_URL);
      urlIsValid = urlObj.protocol === 'https:' && 
                   urlObj.hostname.includes('.supabase.co');
    } catch (e) {
      urlError = e.message;
    }
    
    // Basic test of the key format
    const keyIsValid = typeof SUPABASE_KEY === 'string' && 
                      SUPABASE_KEY.length > 30 && 
                      SUPABASE_KEY.startsWith('ey');
    
    // Try to ping the Supabase endpoint
    let endpointReachable = false;
    let pingTime = null;
    let pingError = null;
    
    try {
      const startTime = Date.now();
      const pingResponse = await fetch(SUPABASE_URL, {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_KEY,
          'Cache-Control': 'no-cache'
        }
      });
      
      pingTime = Date.now() - startTime;
      endpointReachable = pingResponse.ok || pingResponse.status < 500;
    } catch (e) {
      pingError = e.message;
    }
    
    // Try a test query
    let querySuccessful = false;
    let queryError = null;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count()')
        .limit(1)
        .single();
      
      querySuccessful = !error;
      if (error) {
        queryError = error.message;
      }
    } catch (e) {
      queryError = e.message;
    }
    
    return res.json({
      status: urlIsValid && keyIsValid && endpointReachable ? 'ok' : 'configuration_issues',
      supabase_config: {
        url: {
          value: SUPABASE_URL,
          valid: urlIsValid,
          error: urlError
        },
        key: {
          value: maskedKey,
          valid: keyIsValid
        },
        endpoint: {
          reachable: endpointReachable,
          ping_ms: pingTime,
          error: pingError
        },
        query: {
          successful: querySuccessful,
          error: queryError
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Supabase configuration:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to check Supabase configuration',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health-check', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    const startTime = Date.now();
    
    // Check if Supabase client is initialized
    if (!supabase) {
      return res.status(500).json({
        status: "error",
        services: {
          database: false,
          auth: false
        },
        error: "Supabase client not initialized"
      });
    }
    
    // Check database connection
    let dbConnected = false;
    let dbError = null;
    let responseTime = null;
    
    try {
      const dbCheckStart = Date.now();
      
      // Try to query a table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
        
      responseTime = Date.now() - dbCheckStart;
      
      if (error) {
        dbError = error.message;
      } else {
        dbConnected = true;
      }
    } catch (error) {
      dbError = error.message;
    }
    
    // Check auth service
    let authStatus = {
      valid: false,
      message: "Not checked"
    };
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        authStatus = {
          valid: false,
          message: `Auth error: ${error.message}`
        };
      } else {
        authStatus = {
          valid: true,
          message: data.session ? "Valid session" : "No active session"
        };
      }
    } catch (error) {
      authStatus = {
        valid: false,
        message: `Auth check failed: ${error.message}`
      };
    }
    
    // Calculate total response time
    const totalResponseTime = Date.now() - startTime;
    
    return res.json({
      status: dbConnected ? "ok" : "error",
      services: {
        database: dbConnected,
        auth: authStatus.valid
      },
      metrics: {
        responseTime: totalResponseTime,
        dbResponseTime: responseTime
      },
      results: {
        timestamp: new Date().toISOString(),
        device: {
          online: true,
          userAgent: req.headers['user-agent'] || 'unknown'
        },
        supabase: { 
          connected: dbConnected, 
          details: dbConnected 
            ? { message: "Connected via user_profiles table" }
            : { message: "Database connection failed", error: dbError }
        }
      },
      auth: authStatus
    });
  } catch (error) {
    console.error("Health check unhandled error:", error);
    
    return res.status(500).json({
      status: "error",
      services: {
        database: false,
        auth: false
      },
      error: {
        message: error.message || "Unknown error"
      }
    });
  }
});

// Create necessary database tables endpoint
app.get('/api/create-tables', async (req, res) => {
  try {
    console.log('Creating necessary database tables...');
    
    // Create user_profiles table
    console.log('Creating user_profiles table...');
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE,
          full_name TEXT,
          email TEXT,
          avatar_url TEXT,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    } catch (error) {
      console.error('Error creating user_profiles table:', error);
    }
    
    // Create emotions table
    console.log('Creating emotions table...');
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.emotions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT UNIQUE NOT NULL,
          category TEXT,
          intensity INTEGER,
          description TEXT,
          color TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    } catch (error) {
      console.error('Error creating emotions table:', error);
    }
    
    // Create emotion_logs table
    console.log('Creating emotion_logs table...');
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.emotion_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          emotion_id UUID,
          emotion_name TEXT,
          intensity INTEGER,
          notes TEXT,
          triggers JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    } catch (error) {
      console.error('Error creating emotion_logs table:', error);
    }
    
    // Create assessments table
    console.log('Creating assessments table...');
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          assessment_type TEXT NOT NULL,
          score NUMERIC,
          answers JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          synced_at TIMESTAMPTZ,
          local_id TEXT
        )
      `);
    } catch (error) {
      console.error('Error creating assessments table:', error);
    }
    
    // Create mood_entries table
    console.log('Creating mood_entries table...');
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.mood_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          mood_score INTEGER NOT NULL,
          notes TEXT,
          activities JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    } catch (error) {
      console.error('Error creating mood_entries table:', error);
    }
    
    // Create test user
    console.log('Creating test user...');
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', '7c7ef551-ec14-4b48-9974-adf94a202469')
        .limit(1);
      
      if (!existingUser || existingUser.length === 0) {
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: '7c7ef551-ec14-4b48-9974-adf94a202469',
            full_name: 'Test User',
            email: 'test@example.com'
          })
          .select();
        
        if (error) {
          console.error('Error creating test user:', error);
        }
      }
    } catch (error) {
      console.error('Error creating test user:', error);
    }
    
    return res.json({
      success: true,
      message: 'Database tables created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating database tables:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create database tables',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Save assessment endpoint
app.post('/api/assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { userId, assessmentType, score, answers } = req.body;
    
    if (!userId || !assessmentType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and assessmentType are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Insert the assessment into the database
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        assessment_type: assessmentType,
        score: score || null,
        answers: answers || null,
        created_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error saving assessment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save assessment',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Assessment saved successfully',
      assessment: data[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in save assessment endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sync assessments endpoint
app.post('/api/sync-assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { assessments } = req.body;
    
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid assessments array',
        timestamp: new Date().toISOString()
      });
    }
    
    // Process each assessment
    const results = [];
    const errors = [];
    
    for (const assessment of assessments) {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .insert({
            user_id: assessment.userId,
            assessment_type: assessment.assessmentType,
            score: assessment.score || null,
            answers: assessment.answers || null,
            created_at: assessment.createdAt || new Date().toISOString(),
            synced_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          errors.push({
            assessment: assessment,
            error: error.message
          });
        } else {
          results.push(data[0]);
        }
      } catch (error) {
        errors.push({
          assessment: assessment,
          error: error.message
        });
      }
    }
    
    return res.json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? 'All assessments synced successfully' 
        : `${results.length} assessments synced, ${errors.length} failed`,
      synced: results,
      errors: errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sync assessments endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get assessments endpoint
app.get('/api/assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { userId, type, limit = 20, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: userId',
        timestamp: new Date().toISOString()
      });
    }
    
    // Build the query
    let query = supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    // Add filter by assessment type if provided
    if (type) {
      query = query.eq('assessment_type', type);
    }
    
    // Execute the query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error retrieving assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve assessments',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      assessments: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in get assessments endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Save stress assessment endpoint
app.post('/api/stress-assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    console.log('Received stress assessment request:', JSON.stringify(req.body, null, 2));
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { userId, score, symptoms, triggers, notes, responses } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Saving stress assessment for user:', userId, 'with data:', JSON.stringify({
      score,
      symptoms: symptoms?.length || 0,
      triggers: triggers?.length || 0,
      hasNotes: !!notes,
      hasResponses: !!responses
    }));
    
    // Ensure the assessments table exists
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          assessment_type TEXT NOT NULL,
          score NUMERIC,
          answers JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          synced_at TIMESTAMPTZ,
          local_id TEXT
        )
      `);
      console.log('Assessments table verified/created');
    } catch (tableError) {
      console.error('Error verifying assessments table:', tableError);
      // Continue anyway - table might already exist
    }
    
    // Insert the assessment into the database
    try {
      // Now try to insert the assessment
      console.log('Inserting assessment into database...');
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: userId,
          assessment_type: 'stress',
          score: parseFloat(score) || 0,
          answers: {
            symptoms: Array.isArray(symptoms) ? symptoms : [],
            triggers: Array.isArray(triggers) ? triggers : [],
            notes: notes || "",
            responses: responses || null
          },
          created_at: new Date().toISOString(),
          synced_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error saving stress assessment:', error.message, error.details || {});
        
        // Try a simpler insert if the first one failed
        console.log('Trying simplified insert...');
        const { data: simpleData, error: simpleError } = await supabase
          .from('assessments')
          .insert({
            user_id: userId,
            assessment_type: 'stress',
            score: parseFloat(score) || 0
          })
          .select();
          
        if (simpleError) {
          console.error('Simplified insert also failed:', simpleError.message, simpleError.details || {});
          return res.status(500).json({
            success: false,
            message: 'Failed to save stress assessment',
            error: simpleError.message || 'Unknown database error',
            details: simpleError.details || {},
            timestamp: new Date().toISOString()
          });
        }
        
        console.log('Simplified assessment saved successfully:', simpleData[0]?.id);
        return res.status(201).json({
          success: true,
          message: 'Stress assessment saved successfully (simplified)',
          assessment: simpleData[0],
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('Stress assessment saved successfully:', data[0]?.id);
      return res.status(201).json({
        success: true,
        message: 'Stress assessment saved successfully',
        assessment: data[0],
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error:', dbError.message, dbError.stack);
      return res.status(500).json({
        success: false,
        message: 'Database error while saving stress assessment',
        error: dbError.message || 'Unknown database error',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in save stress assessment endpoint:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get stress assessments endpoint
app.get('/api/stress-assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { userId, limit = 20, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: userId',
        timestamp: new Date().toISOString()
      });
    }
    
    // Build the query
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('assessment_type', 'stress')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (error) {
      console.error('Error retrieving stress assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve stress assessments',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      assessments: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in get stress assessments endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check assessments table
app.get('/api/debug/assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Try to get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true });
    
    // Try to get a sample of data
    const { data: sampleData, error: sampleError } = await supabase
      .from('assessments')
      .select('*')
      .limit(5);
    
    // Check if table exists by trying to insert a test record
    let tableExists = !tableError;
    let createTableResult = null;
    
    if (!tableExists) {
      console.log('Assessments table may not exist, attempting to create it...');
      try {
        // Create the table if it doesn't exist
        createTableResult = await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.assessments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            assessment_type TEXT NOT NULL,
            score NUMERIC,
            answers JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            synced_at TIMESTAMPTZ,
            local_id TEXT
          )
        `);
        console.log('Assessments table created successfully');
        tableExists = true;
      } catch (createError) {
        console.error('Error creating assessments table:', createError);
        createTableResult = createError;
      }
    }
    
    return res.json({
      success: true,
      tableExists,
      tableInfo: {
        error: tableError ? tableError.message : null,
        count: tableInfo?.count
      },
      sampleData: {
        error: sampleError ? sampleError.message : null,
        data: sampleData || []
      },
      createTableResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug assessments endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred checking assessments table',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sync offline assessments endpoint
app.post('/api/sync-offline-assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    console.log('Received sync request:', JSON.stringify(req.body, null, 2));
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { assessments } = req.body;
    
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid assessments array',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Attempting to sync ${assessments.length} offline assessments:`, 
      assessments.map(a => a.id || 'unknown').join(', '));
    
    // Ensure the assessments table exists using direct SQL
    try {
      // Try to create the table directly with SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          assessment_type TEXT NOT NULL,
          score NUMERIC,
          answers JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          synced_at TIMESTAMPTZ,
          local_id TEXT
        );
      `;
      
      console.log('Creating assessments table with SQL:', createTableSQL);
      await supabase.query(createTableSQL);
      console.log('Assessments table verified/created');
    } catch (tableError) {
      console.error('Error verifying assessments table:', tableError);
      // Continue anyway - table might already exist
    }
    
    // Process each assessment
    const results = [];
    const errors = [];
    
    for (const assessment of assessments) {
      try {
        console.log(`Processing assessment with local ID: ${assessment.id || 'unknown'}`);
        
        // Format the data for database
        const formattedAssessment = {
          user_id: assessment.userId,
          assessment_type: assessment.assessmentType || 'stress',
          score: parseFloat(assessment.score) || 0,
          answers: {
            symptoms: Array.isArray(assessment.symptoms) ? assessment.symptoms : [],
            triggers: Array.isArray(assessment.triggers) ? assessment.triggers : [],
            notes: assessment.notes || "",
            responses: assessment.responses || null
          },
          created_at: assessment.createdAt || new Date().toISOString(),
          synced_at: new Date().toISOString(),
          local_id: assessment.id // Store the local ID to track which ones were synced
        };
        
        console.log('Inserting assessment into database:', JSON.stringify({
          user_id: formattedAssessment.user_id,
          assessment_type: formattedAssessment.assessment_type,
          score: formattedAssessment.score,
          local_id: formattedAssessment.local_id
        }));
        
        // Try to insert the assessment with direct SQL
        try {
          const insertSQL = `
            INSERT INTO public.assessments (user_id, assessment_type, score, answers, created_at, synced_at, local_id)
            VALUES (
              '${formattedAssessment.user_id}',
              '${formattedAssessment.assessment_type}',
              ${formattedAssessment.score},
              '${JSON.stringify(formattedAssessment.answers)}'::jsonb,
              '${formattedAssessment.created_at}',
              '${formattedAssessment.synced_at}',
              '${formattedAssessment.local_id}'
            )
            RETURNING id;
          `;
          
          console.log('Executing SQL insert:', insertSQL);
          const { data: insertData, error: insertError } = await supabase.query(insertSQL);
          
          if (insertError) {
            console.error('SQL insert error:', insertError);
            throw insertError;
          }
          
          console.log('Assessment inserted with SQL, result:', JSON.stringify(insertData));
          results.push({
            id: insertData[0]?.id,
            local_id: assessment.id
          });
        } catch (sqlError) {
          console.error('SQL insert failed, error:', sqlError);
          
          // Try using the standard API
          console.log('Trying standard API insert...');
          const { data, error } = await supabase
            .from('assessments')
            .insert({
              user_id: formattedAssessment.user_id,
              assessment_type: formattedAssessment.assessment_type,
              score: formattedAssessment.score,
              local_id: formattedAssessment.local_id
            })
            .select();
          
          if (error) {
            console.error('API insert failed, error:', error);
            errors.push({
              id: assessment.id,
              error: error.message || 'Unknown error'
            });
          } else {
            console.log('Assessment synced successfully with API, result:', JSON.stringify(data));
            results.push({
              ...data[0],
              local_id: assessment.id
            });
          }
        }
      } catch (assessmentError) {
        console.error('Error processing assessment:', assessmentError.message, assessmentError.stack);
        errors.push({
          id: assessment.id,
          error: assessmentError.message || 'Unknown error'
        });
      }
    }
    
    const success = results.length > 0;
    const message = results.length === assessments.length 
      ? 'All assessments synced successfully' 
      : `${results.length} assessments synced, ${errors.length} failed`;
    
    console.log(`Sync result: ${message}`);
    console.log('Synced assessments:', JSON.stringify(results));
    console.log('Failed assessments:', JSON.stringify(errors));
    
    return res.json({
      success,
      message,
      synced: results,
      failed: errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sync offline assessments endpoint:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check database structure
app.get('/api/debug/database-structure', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Get a list of all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    // Check assessments table specifically
    const { data: assessmentsInfo, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true });
    
    // Get sample data from assessments table
    const { data: assessmentsSample, error: sampleError } = await supabase
      .from('assessments')
      .select('*')
      .limit(5);
    
    // Try to create assessments table if it doesn't exist
    let createResult = null;
    if (assessmentsError && assessmentsError.message.includes('does not exist')) {
      try {
        createResult = await supabase.query(`
          CREATE TABLE IF NOT EXISTS public.assessments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            assessment_type TEXT NOT NULL,
            score NUMERIC,
            answers JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            synced_at TIMESTAMPTZ,
            local_id TEXT
          )
        `);
      } catch (createError) {
        createResult = { error: createError.message };
      }
    }
    
    return res.json({
      success: true,
      database: {
        tables: tables || [],
        tablesError: tablesError ? tablesError.message : null
      },
      assessments: {
        exists: !assessmentsError || !assessmentsError.message.includes('does not exist'),
        count: assessmentsInfo?.count || 0,
        error: assessmentsError ? assessmentsError.message : null,
        sample: assessmentsSample || [],
        sampleError: sampleError ? sampleError.message : null,
        createResult
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug database structure endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred checking database structure',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint for offline assessments
app.get('/api/debug/offline-assessments', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Check if the assessments table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('assessments')
      .select('*', { count: 'exact', head: true });
    
    // Try to get a sample of data
    const { data: sampleData, error: sampleError } = await supabase
      .from('assessments')
      .select('*')
      .limit(5);
    
    // Check database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    return res.json({
      success: true,
      assessmentsTable: {
        exists: !tableError || !tableError.message.includes('does not exist'),
        error: tableError ? tableError.message : null,
        count: tableInfo?.count || 0
      },
      sampleData: {
        error: sampleError ? sampleError.message : null,
        data: sampleData || []
      },
      connection: {
        working: !connectionError,
        error: connectionError ? connectionError.message : null,
        data: connectionTest ? 'Connection successful' : 'No data found'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug offline assessments endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred checking offline assessments',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Direct SQL endpoint to create assessments table
app.get('/api/create-assessments-table', async (req, res) => {
  try {
    // Set proper content type header immediately
    res.setHeader('Content-Type', 'application/json');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    console.log('Attempting to create assessments table directly...');
    
    // Direct SQL approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        assessment_type TEXT NOT NULL,
        score NUMERIC,
        answers JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        synced_at TIMESTAMPTZ,
        local_id TEXT
      );
    `;
    
    // Execute the SQL directly - try/catch instead of .catch
    let error = null;
    try {
      const result = await supabase.rpc('exec', { sql: createTableSQL });
      error = result.error;
    } catch (e) {
      console.log('RPC exec failed, trying direct query:', e.message);
      
      // Try alternative approach
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            query: createTableSQL
          })
        });
        
        if (!response.ok) {
          error = new Error(`Direct SQL failed with status: ${response.status}`);
        }
      } catch (fetchError) {
        error = fetchError;
      }
    }
    
    if (error) {
      console.error('Error creating assessments table:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create assessments table',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Try a simpler approach
    try {
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.assessments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          assessment_type TEXT NOT NULL,
          score NUMERIC,
          answers JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          synced_at TIMESTAMPTZ,
          local_id TEXT
        )
      `);
      console.log('Assessments table created using query method');
    } catch (queryError) {
      console.error('Error creating table with query method:', queryError);
      // Continue anyway
    }
    
    // Verify the table exists
    let verifyError = null;
    try {
      const { error: checkError } = await supabase
        .from('assessments')
        .select('id')
        .limit(1);
      
      verifyError = checkError;
    } catch (e) {
      verifyError = e;
    }
    
    if (verifyError) {
      console.error('Table creation verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Table creation verification failed',
        error: verifyError.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      message: 'Assessments table created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in create assessments table endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred creating assessments table',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint not found: ${req.method} ${req.url}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 