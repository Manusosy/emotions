/**
 * Utility to check and manage locally stored assessment data
 */

import { toast } from 'sonner';
import syncService from '@/services/syncService';

/**
 * Check if there are any assessments stored in localStorage
 * @returns Object with count and data
 */
export function checkLocalAssessments() {
  try {
    const storedAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
    return {
      count: storedAssessments.length,
      data: storedAssessments
    };
  } catch (err) {
    console.error('Error checking local assessments:', err);
    return { count: 0, data: [] };
  }
}

/**
 * Force sync all locally stored assessments to the database
 */
export async function forceSync(): Promise<boolean> {
  const { count } = checkLocalAssessments();
  
  if (count === 0) {
    toast.info('No locally stored assessments to sync');
    return true;
  }
  
  try {
    const result = await syncService.syncOfflineAssessments();
    
    if (result.success) {
      const remainingCount = checkLocalAssessments().count;
      if (remainingCount === 0) {
        toast.success('All assessments synced successfully!');
        return true;
      } else {
        toast.info(`Synced ${result.count} assessments. ${remainingCount} remaining.`);
        return false;
      }
    } else {
      toast.error('Failed to sync assessments. Please try again later.');
      return false;
    }
  } catch (err) {
    console.error('Error syncing assessments:', err);
    toast.error('Error syncing assessments. Please try again later.');
    return false;
  }
}

/**
 * Clear all locally stored assessments
 * Use with caution as this will permanently delete any unsynced data
 */
export function clearLocalAssessments(): boolean {
  try {
    localStorage.removeItem('offlineAssessments');
    toast.success('Local assessments cleared');
    return true;
  } catch (err) {
    console.error('Error clearing local assessments:', err);
    toast.error('Failed to clear local assessments');
    return false;
  }
}

/**
 * Debug function to log all locally stored assessments to console
 */
export function debugLocalAssessments() {
  const { data, count } = checkLocalAssessments();
  console.log(`Found ${count} locally stored assessments:`, data);
  return { count, data };
} 