import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Database, Server, HardDrive, Wifi, WifiOff, Cloud, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { debugLocalAssessments, forceSync, clearLocalAssessments } from '@/utils/assessment-storage-check';

/**
 * Diagnostic tool component for checking system status and database connectivity
 */
export function DiagnosticTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unchecked' | 'online' | 'offline'>('unchecked');
  const [dbStatus, setDbStatus] = useState<'unchecked' | 'connected' | 'disconnected'>('unchecked');
  const [localData, setLocalData] = useState<any[]>([]);
  
  // Check API and database connection
  const checkConnection = async () => {
    setIsChecking(true);
    
    try {
      // Check API connection
      const apiResponse = await fetch('/api/health-check');
      if (apiResponse.ok) {
        setApiStatus('online');
        const data = await apiResponse.json();
        
        // Check database status from health check
        if (data.services && data.services.database) {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } else {
        setApiStatus('offline');
        setDbStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setApiStatus('offline');
      setDbStatus('disconnected');
    } finally {
      setIsChecking(false);
    }
  };
  
  // Check for locally stored assessments
  const checkLocalStorage = () => {
    const result = debugLocalAssessments();
    setLocalData(result.data);
    
    if (result.count > 0) {
      toast.info(`Found ${result.count} assessments in local storage`);
    } else {
      toast.info('No assessments found in local storage');
    }
  };
  
  // Attempt to sync locally stored assessments
  const syncLocalData = async () => {
    setIsChecking(true);
    try {
      await forceSync();
      
      // Refresh local data after sync
      const result = debugLocalAssessments();
      setLocalData(result.data);
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
      clearLocalAssessments();
      setLocalData([]);
    }
  };
  
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
                {apiStatus === 'unchecked' ? 'Unknown' : apiStatus}
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
                {dbStatus === 'unchecked' ? 'Unknown' : dbStatus}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span>Local Data</span>
              </div>
              <Badge variant={localData.length > 0 ? 'secondary' : 'outline'}>
                {localData.length} items
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={checkConnection}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Check Connection'}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={checkLocalStorage}
              disabled={isChecking}
            >
              Check Local Storage
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={syncLocalData}
              disabled={isChecking || localData.length === 0}
            >
              Sync Local Data
            </Button>
            
            <Button 
              size="sm" 
              variant="destructive"
              onClick={clearLocalStorage}
              disabled={isChecking || localData.length === 0}
            >
              Clear Local Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 