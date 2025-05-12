import React, { useEffect, useState } from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import syncService from '@/services/syncService';
import { toast } from 'sonner';
import { devLog } from '@/utils/environment';
import { isOnline } from '@/utils/network';

/**
 * Handles automatic syncing of offline data when connection is restored
 * This component should be placed near the top of the component tree
 */
export default function ConnectionSyncHandler() {
  const { isConnected, isOffline } = useConnection();
  const [lastConnectionState, setLastConnectionState] = useState<boolean | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [offlineCount, setOfflineCount] = useState({ total: 0, assessments: 0, profiles: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnlineState, setIsOnlineState] = useState(isOnline());
  
  // Check for connection changes and sync data when connection is restored
  useEffect(() => {
    // Skip the first render
    if (lastConnectionState === null) {
      setLastConnectionState(isConnected);
      return;
    }
    
    // If connection was restored (was offline, now online)
    if (!lastConnectionState && isConnected) {
      devLog('Connection restored, checking for offline data to sync');
      syncOfflineData();
    }
    
    // Update the last connection state
    setLastConnectionState(isConnected);
  }, [isConnected, isOffline, lastConnectionState]);
  
  // On component mount, check if there's offline data that needs syncing
  useEffect(() => {
    const checkForOfflineData = async () => {
      const hasAssessments = syncService.hasOfflineAssessments();
      const hasProfiles = syncService.hasOfflineMentorProfiles();
      
      const totalItems = 
        syncService.getOfflineAssessmentCount() + 
        syncService.getOfflineMentorProfilesCount();
      
      if (isConnected && (hasAssessments || hasProfiles)) {
        toast.info(`Found ${totalItems} items saved offline. Syncing...`);
        syncOfflineData();
      }
    };
    
    // Check after a short delay to let other components initialize
    const timer = setTimeout(checkForOfflineData, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Function to sync offline data
  const syncOfflineData = async () => {
    if (syncInProgress || !isConnected) return;
    
    setSyncInProgress(true);
    try {
      const result = await syncService.forceSyncAll();
      
      if (result.success) {
        const total = result.assessmentsCount + result.profilesCount;
        if (total > 0) {
          toast.success(`Successfully synced ${total} items that were saved offline`);
        }
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      setSyncInProgress(false);
    }
  };
  
  // Update offline count on mount and when localStorage changes
  useEffect(() => {
    // Initial count
    updateOfflineCount();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      updateOfflineCount();
    };
    
    // Listen for online/offline events
    const handleOnlineStatus = () => {
      setIsOnlineState(isOnline());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Check every 30 seconds
    const interval = setInterval(updateOfflineCount, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(interval);
    };
  }, []);
  
  // Update the offline count
  const updateOfflineCount = () => {
    const counts = syncService.getOfflineCount();
    setOfflineCount(counts);
  };
  
  // Handle sync button click
  const handleSync = async () => {
    if (!isOnlineState) {
      toast.error('You are currently offline. Please connect to the internet to sync.');
      return;
    }
    
    if (offlineCount.total === 0) {
      toast.info('No offline items to sync.');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Sync assessments
      if (offlineCount.assessments > 0) {
        const result = await syncService.syncOfflineAssessments();
        if (result.success) {
          toast.success(`Synced ${result.count} assessments`);
        } else {
          toast.error('Failed to sync some assessments');
        }
      }
      
      // Sync profiles (if implemented)
      if (offlineCount.profiles > 0) {
        // Implement profile sync if needed
      }
      
      // Update counts after sync
      updateOfflineCount();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Error during sync process');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Don't render if no offline items
  if (offlineCount.total === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 cursor-pointer z-50" onClick={handleSync}>
      <div className="relative">
        <span className="material-icons">{isOnlineState ? 'cloud_sync' : 'cloud_off'}</span>
        <span id="offline-count" className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center" data-count={offlineCount.total}>
          {offlineCount.total}
        </span>
      </div>
      <div>
        <div className="text-sm font-medium">
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </div>
        <div id="offline-tooltip" className="text-xs opacity-80">
          {offlineCount.assessments} assessments, {offlineCount.profiles} profiles
        </div>
      </div>
    </div>
  );
} 