import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isOnline } from '@/utils/network';
import { checkConnection } from '@/lib/supabase';
import { toast } from 'sonner';

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

interface ConnectionContextType {
  isConnected: boolean;
  isChecking: boolean;
  isOffline: boolean;
  connectionStatus: ConnectionStatus;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: false,
  isChecking: false,
  isOffline: false,
  connectionStatus: 'checking',
  lastChecked: null,
  checkConnection: async () => false,
});

export function useConnection() {
  return useContext(ConnectionContext);
}

interface ConnectionProviderProps {
  children: ReactNode;
  checkInterval?: number; // How often to check connection in ms (0 to disable)
}

export function ConnectionProvider({ 
  children,
  checkInterval = 30000 // Default to 30 seconds
}: ConnectionProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());
  
  const checkConnectionStatus = async (): Promise<boolean> => {
    if (isChecking) return connectionStatus === 'connected';
    
    // First check if device is offline
    if (!isOnline()) {
      setIsOffline(true);
      setConnectionStatus('disconnected');
      return false;
    }
    
    setIsOffline(false);
    setIsChecking(true);
    
    try {
      // Try both API health check paths to ensure compatibility
      let response = null;
      let apiCheckSucceeded = false;
      let dbConnected = false;
      
      // First try the app directory API route
      try {
        response = await fetch('/api/health-check', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(3000) // Timeout after 3s
        });
        
        if (response.ok) {
          const data = await response.json();
          apiCheckSucceeded = true;
          dbConnected = data.services && data.services.database;
          console.log('API health check succeeded via /api/health-check', data);
        }
      } catch (error) {
        console.log('Health check via /api/health-check failed, trying fallback path');
      }
      
      // If the first attempt failed, try the api directory route as fallback
      if (!apiCheckSucceeded) {
        try {
          response = await fetch('/src/api/health-check', {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(3000) // Timeout after 3s
          });
          
          if (response.ok) {
            const data = await response.json();
            apiCheckSucceeded = true;
            dbConnected = data.services && data.services.database;
            console.log('API health check succeeded via fallback path', data);
          } 
        } catch (error) {
          console.log('Health check via fallback path failed');
        }
      }
      
      // If none of the health checks work, try direct Supabase check
      if (!apiCheckSucceeded) {
        dbConnected = await checkConnection();
        console.log('Falling back to direct Supabase connection check, result:', dbConnected);
      }
      
      // Update connection status based on checks
      setConnectionStatus(dbConnected ? 'connected' : 'disconnected');
      setLastChecked(new Date());
      return dbConnected;
    } catch (error) {
      console.error('Connection check error:', error);
      setConnectionStatus('disconnected');
      setLastChecked(new Date());
      return false;
    } finally {
      setIsChecking(false);
    }
  };
  
  // Check connection on mount
  useEffect(() => {
    checkConnectionStatus();
    
    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOffline(false);
      toast.info('Network connection restored');
      checkConnectionStatus();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionStatus('disconnected');
      toast.warning('You are now offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up interval to periodically check connection if needed
    let intervalId: NodeJS.Timeout | null = null;
    
    if (checkInterval > 0) {
      intervalId = setInterval(() => {
        checkConnectionStatus();
      }, checkInterval);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkInterval]);
  
  const value = {
    isConnected: connectionStatus === 'connected',
    isChecking,
    isOffline,
    connectionStatus,
    lastChecked,
    checkConnection: checkConnectionStatus
  };
  
  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
} 