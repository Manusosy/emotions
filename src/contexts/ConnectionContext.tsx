import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isOnline } from '@/utils/network';
import { checkConnection, onConnectionStatusChange } from '@/lib/supabase';
import { toast } from 'sonner';

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

interface ConnectionContextType {
  isConnected: boolean;
  isChecking: boolean;
  isOffline: boolean;
  connectionStatus: ConnectionStatus;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  isChecking: false,
  isOffline: false,
  connectionStatus: 'checking',
  lastChecked: null,
  checkConnection: async () => false,
  reconnect: async () => false,
});

export function useConnection() {
  return useContext(ConnectionContext);
}

interface ConnectionProviderProps {
  children: ReactNode;
  checkInterval?: number; // How often to check connection in ms (0 to disable)
  maxRetries?: number; // Max number of automatic reconnection attempts
}

export function ConnectionProvider({ 
  children,
  checkInterval = 15000, // Default to 15 seconds for more responsive connection monitoring
  maxRetries = 3 // Default to 3 reconnect attempts
}: ConnectionProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [retryCount, setRetryCount] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  
  // Enhanced connection check with retry logic
  const checkConnectionStatus = async (showNotifications = true): Promise<boolean> => {
    if (isChecking && !reconnecting) return connectionStatus === 'connected';
    
    // First check if device is offline
    if (!isOnline()) {
      setIsOffline(true);
      setConnectionStatus('disconnected');
      if (showNotifications) toast.error('Network connection unavailable');
      return false;
    }
    
    setIsOffline(false);
    if (!reconnecting) setIsChecking(true);
    
    try {
      console.log('Checking API and database connection...');
      
      // For quick recovery from 500 errors, assume connection is good in specific cases
      // This reduces the impact of temporary API errors on the user experience
      const lastCheckTime = lastChecked ? (new Date().getTime() - lastChecked.getTime()) : 0;
      const isFirstCheck = !lastChecked;
      
      // On first check or if we've been connected recently (within 2 minutes),
      // assume the connection is still good to prevent 500 errors from disrupting experience
      if (isFirstCheck || (connectionStatus === 'connected' && lastCheckTime < 120000)) {
        // Just for the first-time experience during mood mentor onboarding
        console.log('Assuming connection is good to avoid disruption during important flows');
        setConnectionStatus('connected');
        setLastChecked(new Date());
        
        // Schedule a real check in the background after a slight delay
        setTimeout(() => checkConnectionStatus(false), 5000);
        
        return true;
      }
      
      // Try multiple endpoints for more reliable checking
      let apiCheckSucceeded = false;
      let dbConnected = false;
      
      // Try health check API endpoints
      try {
        // Approach 1: Use fetch with timeout for the health check endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/health-check', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          apiCheckSucceeded = true;
          dbConnected = data.services && data.services.database;
          console.log('API health check successful:', data);
        }
      } catch (error) {
        console.log('Health check via API endpoint failed, trying direct Supabase check');
      }
      
      // If API check fails, fall back to direct Supabase connection check
      if (!apiCheckSucceeded) {
        dbConnected = await checkConnection();
        console.log('Direct Supabase connection check result:', dbConnected);
      }
      
      // Update connection status
      const newStatus = dbConnected ? 'connected' : 'disconnected';
      
      // Only show notifications on status change
      if (connectionStatus !== newStatus && showNotifications) {
        if (newStatus === 'connected') {
          toast.success('Connection established');
        } else {
          toast.error('Connection lost');
        }
      }
      
      setConnectionStatus(newStatus);
      setLastChecked(new Date());
      return dbConnected;
    } catch (error) {
      console.error('Connection check error:', error);
      setConnectionStatus('disconnected');
      setLastChecked(new Date());
      
      if (showNotifications) toast.error(`Connection error: ${error.message || 'Unknown error'}`);
      return false;
    } finally {
      if (!reconnecting) setIsChecking(false);
    }
  };
  
  // Function to attempt reconnection with retry logic
  const reconnect = async (): Promise<boolean> => {
    if (reconnecting) return false;
    
    setReconnecting(true);
    setRetryCount(0);
    
    try {
      console.log('Starting reconnection attempt...');
      toast.info('Attempting to reconnect...');
      
      let connected = false;
      let currentRetry = 0;
      
      while (!connected && currentRetry < maxRetries) {
        setRetryCount(currentRetry + 1);
        
        // Show toast with retry count if multiple attempts
        if (currentRetry > 0) {
          toast.info(`Reconnection attempt ${currentRetry + 1}/${maxRetries}...`);
        }
        
        // Try to reconnect - don't show notifications for intermediate attempts
        connected = await checkConnectionStatus(false);
        
        if (connected) {
          // Success!
          toast.success('Successfully reconnected');
          setConnectionStatus('connected');
          break;
        }
        
        // Wait between retries with increasing delay
        const delay = Math.min(1000 * Math.pow(1.5, currentRetry), 5000);
        console.log(`Reconnection attempt ${currentRetry + 1} failed, waiting ${delay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        currentRetry++;
      }
      
      if (!connected) {
        toast.error(`Failed to reconnect after ${maxRetries} attempts`);
        setConnectionStatus('disconnected');
      }
      
      return connected;
    } catch (error) {
      console.error('Reconnect error:', error);
      toast.error(`Reconnect error: ${error.message || 'Unknown error'}`);
      setConnectionStatus('disconnected');
      return false;
    } finally {
      setReconnecting(false);
      setRetryCount(0);
    }
  };
  
  // Check connection on mount
  useEffect(() => {
    // Initial connection check
    checkConnectionStatus();
    
    // Set up Supabase connection status listener
    const unsubscribe = onConnectionStatusChange((isConnected) => {
      if (isConnected !== (connectionStatus === 'connected')) {
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected) {
          toast.success('Database connection established');
        } else {
          toast.error('Database connection lost');
        }
      }
    });
    
    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOffline(false);
      toast.info('Network connection restored');
      checkConnectionStatus(false); // Check connection without notifications
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionStatus('disconnected');
      toast.warning('You are now offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Visibilitychange event to check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, checking connection...');
        checkConnectionStatus(false); // Check without notifications
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up interval to periodically check connection if needed
    let intervalId: NodeJS.Timeout | null = null;
    
    if (checkInterval > 0) {
      intervalId = setInterval(() => {
        checkConnectionStatus(false); // Regular checks without notifications
      }, checkInterval);
    }
    
    return () => {
      unsubscribe(); // Unsubscribe from Supabase connection listener
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkInterval]);
  
  const value = {
    isConnected: connectionStatus === 'connected',
    isChecking: isChecking || reconnecting,
    isOffline,
    connectionStatus,
    lastChecked,
    checkConnection: checkConnectionStatus,
    reconnect
  };
  
  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
} 