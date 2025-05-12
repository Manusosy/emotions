import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Database, Server, HardDrive, Wifi, WifiOff, Cloud, CheckCircle2, XCircle, RefreshCw, Users, Wrench, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { debugLocalAssessments, forceSync, clearLocalAssessments } from '@/utils/assessment-storage-check';
import { useConnection } from '@/contexts/ConnectionContext';
import { runNetworkDiagnostics, checkApiDirectly } from '@/utils/network';
import syncService from '@/services/syncService';
import { isDevelopment } from '@/utils/environment';

/**
 * Helper function to check if diagnostics are enabled via env var
 */
const isDiagnosticsEnabled = () => {
  // Check for specific environment variable that enables diagnostics
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_ENABLE_DIAGNOSTICS === 'true';
  }
  
  // Default to only enabled in development if no explicit flag
  return isDevelopment();
};

/**
 * Diagnostic tool component for checking system status and database connectivity
 */
export function DiagnosticTool() {
  // Only render when diagnostics are enabled (development mode or explicit flag)
  if (!isDiagnosticsEnabled()) {
    return null;
  }
  
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isFixingDb, setIsFixingDb] = useState(false);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const { isConnected, isOffline, connectionStatus, checkConnection } = useConnection();
  const [localData, setLocalData] = useState<any[]>([]);
  const [localProfiles, setLocalProfiles] = useState<any[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [apiResults, setApiResults] = useState<any>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  
  // Map connection status to UI state
  const apiStatus = apiResults?.apiConnected ? 'online' : 
                   (isOffline ? 'offline' : (isConnected ? 'online' : 'offline'));
  const dbStatus = apiResults?.databaseConnected ? 'connected' : 
                  (isOffline ? 'disconnected' : (isConnected ? 'connected' : 'disconnected'));
  
  // Check API and database connection using ConnectionContext
  const handleCheckConnection = async () => {
    setIsChecking(true);
    
    try {
      // First run network diagnostics
      const networkResults = await runNetworkDiagnostics('/api/health-check');
      setDiagnosticResults(networkResults);
      
      // Then do a direct API check
      const apiCheckResults = await checkApiDirectly();
      setApiResults(apiCheckResults);
      
      // Then check the Connection context's connection
      await checkConnection();
      
      if (apiCheckResults.apiConnected && apiCheckResults.databaseConnected) {
        toast.success("Connection to server is healthy");
      } else if (apiCheckResults.apiConnected && !apiCheckResults.databaseConnected) {
        toast.warning("API is online but database connection failed");
      } else if (isOffline) {
        toast.warning("Your device appears to be offline");
      } else {
        toast.error(`Could not connect to the server: ${apiCheckResults.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error performing connection check:', error);
      toast.error('Connection check failed');
    } finally {
      setIsChecking(false);
    }
  };
  
  // Try to fix database connection issues
  const handleFixDatabaseConnection = async () => {
    setIsFixingDb(true);
    
    try {
      toast.loading("Attempting to fix database connection...");
      
      // Try our special db-fix endpoint
      const response = await fetch('/api/db-fix', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      // Check if we got an HTML response instead of JSON
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON response');
      }
      
      // Parse the response carefully
      let result;
      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      if (result.success) {
        toast.success("Database connection successfully refreshed");
        
        // Check if it actually fixed the issue
        await handleCheckConnection();
      } else {
        toast.error(`Failed to fix database connection: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error fixing database connection:', error);
      toast.error(`Connection fix failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsFixingDb(false);
      toast.dismiss();
    }
  };
  
  // Check Supabase configuration and connection status directly
  const checkSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    
    try {
      toast.loading("Checking Supabase configuration...");
      
      const response = await fetch('/api/supabase-status', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      // Check if we got an HTML response instead of JSON
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Server returned HTML instead of JSON response');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to check Supabase status: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response carefully
      let status;
      try {
        const text = await response.text();
        status = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      setSupabaseStatus(status);
      
      if (status.status === 'ok') {
        toast.success("Supabase configuration is valid and endpoint is reachable");
      } else {
        const issues = [];
        
        if (!status.supabase_config.url.valid) {
          issues.push(`Invalid Supabase URL: ${status.supabase_config.url.error}`);
        }
        
        if (!status.supabase_config.key.valid) {
          issues.push('Invalid Supabase API key format');
        }
        
        if (!status.supabase_config.endpoint.reachable) {
          issues.push(`Cannot reach Supabase endpoint: ${status.supabase_config.endpoint.error}`);
        }
        
        toast.error(`Supabase configuration issues: ${issues.join(', ')}`);
      }
      
      // After checking Supabase status, check the API connection
      await handleCheckConnection();
    } catch (error: any) {
      console.error('Error checking Supabase status:', error);
      toast.error(`Failed to check Supabase status: ${error.message}`);
      setSupabaseStatus({
        status: 'error',
        error: error.message
      });
    } finally {
      setIsCheckingSupabase(false);
      toast.dismiss();
    }
  };
  
  // Check for locally stored assessments
  const checkLocalStorage = () => {
    // Check assessments
    const assessmentResult = debugLocalAssessments();
    setLocalData(assessmentResult.data);
    
    // Check mentor profiles
    try {
      const profiles = JSON.parse(localStorage.getItem('offlineMentorProfiles') || '[]');
      setLocalProfiles(profiles);
      
      const totalItems = assessmentResult.count + profiles.length;
      
      if (totalItems > 0) {
        toast.info(`Found ${totalItems} items in local storage (${assessmentResult.count} assessments, ${profiles.length} profiles)`);
      } else {
        toast.info('No data found in local storage');
      }
    } catch (error) {
      console.error('Error checking local profiles:', error);
      toast.error('Failed to check local storage');
    }
  };
  
  // Attempt to sync locally stored data
  const syncLocalData = async () => {
    setIsChecking(true);
    try {
      if (!isConnected) {
        toast.warning("Cannot sync while offline. Please check your connection and try again.");
        setIsChecking(false);
        return;
      }
      
      // Try to sync all types of data
      const syncResult = await syncService.forceSyncAll();
      
      // Refresh local data after sync
      const assessmentResult = debugLocalAssessments();
      setLocalData(assessmentResult.data);
      
      const profiles = JSON.parse(localStorage.getItem('offlineMentorProfiles') || '[]');
      setLocalProfiles(profiles);
      
      const totalItemsRemaining = assessmentResult.count + profiles.length;
      
      if (totalItemsRemaining === 0) {
        toast.success("All data synced successfully!");
      } else {
        toast.info(`${syncResult.assessmentsCount + syncResult.profilesCount} items synced, ${totalItemsRemaining} items still in local storage`);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      toast.error('Failed to sync data. See console for details.');
    } finally {
      setIsChecking(false);
    }
  };
  
  // Emergency clear of local storage (use with caution)
  const clearLocalStorage = () => {
    if (window.confirm('WARNING: This will permanently delete any unsynced data. Are you sure?')) {
      // Clear assessments
      clearLocalAssessments();
      setLocalData([]);
      
      // Clear profiles
      localStorage.removeItem('offlineMentorProfiles');
      setLocalProfiles([]);
      
      toast.success("Local storage cleared");
    }
  };
  
  // Update local data count on open
  useEffect(() => {
    if (isOpen) {
      checkLocalStorage();
      handleCheckConnection();
    }
  }, [isOpen]);
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          className="rounded-full shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Database className="h-4 w-4 mr-2" />
          Diagnostics
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">System Diagnostics</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>API Status</span>
              </div>
              <Badge variant={
                apiStatus === 'online' ? 'success' :
                apiStatus === 'offline' ? 'destructive' : 'outline'
              }>
                {apiStatus}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span>Database Status</span>
              </div>
              <Badge variant={
                dbStatus === 'connected' ? 'success' :
                dbStatus === 'disconnected' ? 'destructive' : 'outline'
              }>
                {dbStatus}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span>Local Data</span>
              </div>
              <Badge variant={(localData.length + localProfiles.length) > 0 ? 'secondary' : 'outline'}>
                {localData.length + localProfiles.length} items
              </Badge>
            </div>
            
            {diagnosticResults && (
              <div className="mt-2 p-2 bg-gray-100 rounded-sm text-xs">
                <p>Network: {diagnosticResults.online ? 'Online' : 'Offline'}</p>
                {diagnosticResults.ping && (
                  <p>Ping: {diagnosticResults.ping}ms</p>
                )}
                {diagnosticResults.error && (
                  <p className="text-red-500">Error: {diagnosticResults.error}</p>
                )}
                
                {apiResults && apiResults.error && (
                  <p className="text-red-500 mt-1">API Error: {apiResults.error}</p>
                )}
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCheckConnection}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              {isChecking ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                apiStatus === 'online' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )
              )}
              {isChecking ? 'Checking...' : 'Check Connection'}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleFixDatabaseConnection}
              disabled={isFixingDb}
              className="flex items-center gap-2"
            >
              {isFixingDb ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Wrench className="h-3 w-3" />
              )}
              {isFixingDb ? 'Fixing...' : 'Fix Database Connection'}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={checkSupabaseStatus}
              disabled={isCheckingSupabase}
              className="flex items-center gap-2"
            >
              {isCheckingSupabase ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              {isCheckingSupabase ? 'Checking...' : 'Check Supabase Config'}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={checkLocalStorage}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <Database className="h-3 w-3" />
              Check Local Storage
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={syncLocalData}
              disabled={isChecking || (localData.length + localProfiles.length) === 0}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              Sync Local Data
            </Button>
            
            <Button 
              size="sm" 
              variant="destructive"
              onClick={clearLocalStorage}
              disabled={isChecking || (localData.length + localProfiles.length) === 0}
              className="flex items-center gap-2"
            >
              <XCircle className="h-3 w-3" />
              Clear Local Storage
            </Button>
          </div>
          
          {supabaseStatus && (
            <div className="mt-2 p-2 bg-gray-100 rounded-sm text-xs">
              <p>Supabase: {supabaseStatus.status === 'ok' ? 'Configured correctly' : 'Configuration issues'}</p>
              {supabaseStatus.supabase_config?.endpoint?.ping_ms && (
                <p>Endpoint Ping: {supabaseStatus.supabase_config.endpoint.ping_ms}ms</p>
              )}
              {supabaseStatus.supabase_config?.url?.error && (
                <p className="text-red-500">URL Error: {supabaseStatus.supabase_config.url.error}</p>
              )}
              {supabaseStatus.supabase_config?.endpoint?.error && (
                <p className="text-red-500">Endpoint Error: {supabaseStatus.supabase_config.endpoint.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 