import { toast } from "sonner";
import { supabase, checkConnection, saveStressAssessment } from "@/lib/supabase";
import { devLog, errorLog } from "@/utils/environment";
import { isOnline } from "@/utils/network";
import { api } from "@/lib/api";

/**
 * Service to handle syncing offline data with the server
 */
const syncService = {
  /**
   * Attempt to sync offline assessments with the server
   * @returns {Promise<{success: boolean, count: number}>} Result of the sync operation
   */
  async syncOfflineAssessments(): Promise<{ success: boolean, count: number }> {
    try {
      // First check if we're online
      if (!isOnline()) {
        devLog("Device appears to be offline, sync aborted");
        return { success: false, count: 0 };
      }
      
      // Get offline assessments from localStorage
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      
      if (offlineAssessments.length === 0) {
        devLog("No offline assessments to sync");
        return { success: true, count: 0 };
      }
      
      devLog(`Attempting to sync ${offlineAssessments.length} offline assessments: ${JSON.stringify(offlineAssessments.map(a => a.id))}`);
      
      // Verify connection to database before proceeding
      const isConnected = await checkConnection();
      if (!isConnected) {
        devLog("Database connection check failed, sync aborted");
        toast.error("Database connection failed. Please try again later.");
        return { success: false, count: 0 };
      }
      
      try {
        // Use the dedicated endpoint to sync all assessments at once
        devLog("Calling /api/sync-offline-assessments endpoint");
        
        const response = await fetch('/api/sync-offline-assessments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ assessments: offlineAssessments })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          devLog(`API returned ${response.status}: ${errorText}`);
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        devLog("Sync result:", JSON.stringify(result));
        
        if (result.success) {
          // Some or all assessments synced successfully
          const syncedIds = result.synced.map((a: any) => a.local_id);
          devLog("Synced IDs:", JSON.stringify(syncedIds));
          
          // Remove synced assessments from localStorage
          const remainingAssessments = offlineAssessments.filter(
            (a: any) => !syncedIds.includes(a.id)
          );
          
          localStorage.setItem('offlineAssessments', JSON.stringify(remainingAssessments));
          
          const successCount = result.synced?.length || 0;
          const failedCount = result.failed?.length || 0;
          
          if (successCount === offlineAssessments.length) {
            toast.success(`Successfully synced ${successCount} offline assessments`);
          } else {
            toast.info(`Synced ${successCount} assessments. ${failedCount} still pending.`);
          }
          
          return { success: true, count: successCount };
        } else {
          // None synced
          toast.error(`Failed to sync assessments. ${result.message}`);
          return { success: false, count: 0 };
        }
      } catch (error: any) {
        // If the dedicated endpoint fails, try the fallback approach
        errorLog("Sync endpoint failed:", error.message);
        toast.error("Sync failed. Trying alternative approach...");
        
        // Track successfully synced assessments
        const synced = [];
        const failed = [];
        
        // Try to sync each assessment individually
        for (const assessment of offlineAssessments) {
          try {
            // Format the data for saving
            const formattedData = {
              userId: assessment.userId,
              score: Number(assessment.score),
              symptoms: assessment.symptoms || [],
              triggers: assessment.triggers || [],
              notes: assessment.notes || "",
              responses: assessment.responses || null
            };
            
            devLog(`Trying to sync individual assessment: ${assessment.id}`);
            
            // Save using the stress assessment endpoint
            const response = await fetch('/api/stress-assessments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify(formattedData)
            });
            
            let result;
            try {
              result = await response.json();
            } catch (e) {
              result = { success: false, error: 'Invalid JSON response' };
            }
            
            if (response.ok && result.success) {
              synced.push(assessment.id);
              devLog(`Successfully synced assessment ${assessment.id}`);
            } else {
              failed.push(assessment.id);
              errorLog(`Failed to sync assessment ${assessment.id}: ${result.error || response.statusText || 'Unknown error'}`);
            }
          } catch (err) {
            errorLog("Error syncing assessment:", err);
            failed.push(assessment.id);
          }
        }
        
        // Remove successfully synced assessments from localStorage
        if (synced.length > 0) {
          const remainingAssessments = offlineAssessments.filter(
            (a: any) => !synced.includes(a.id)
          );
          localStorage.setItem('offlineAssessments', JSON.stringify(remainingAssessments));
          
          if (synced.length === offlineAssessments.length) {
            toast.success(`Successfully synced ${synced.length} offline assessments`);
          } else {
            toast.info(`Synced ${synced.length} assessments. ${failed.length} still pending.`);
          }
        } else {
          toast.error("Failed to sync any assessments. Please try again later.");
        }
        
        return { 
          success: synced.length > 0, 
          count: synced.length 
        };
      }
    } catch (error) {
      errorLog("Error during sync process:", error);
      toast.error("Failed to sync data. Please try again later.");
      return { success: false, count: 0 };
    }
  },
  
  /**
   * Check if there are offline assessments waiting to be synced
   */
  hasOfflineAssessments(): boolean {
    try {
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      return offlineAssessments.length > 0;
    } catch (err) {
      errorLog("Error checking offline assessments:", err);
      return false;
    }
  },
  
  /**
   * Get count of offline assessments
   */
  getOfflineAssessmentCount(): number {
    try {
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      return offlineAssessments.length;
    } catch (err) {
      errorLog("Error counting offline assessments:", err);
      return 0;
    }
  },
  
  /**
   * Get all offline assessments
   */
  getOfflineAssessments(): any[] {
    try {
      return JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
    } catch (err) {
      errorLog("Error retrieving offline assessments:", err);
      return [];
    }
  },
  
  /**
   * Clear a specific offline assessment by ID
   */
  clearOfflineAssessment(id: string): boolean {
    try {
      const assessments = this.getOfflineAssessments();
      const filtered = assessments.filter((a: any) => a.id !== id);
      
      if (filtered.length !== assessments.length) {
        localStorage.setItem('offlineAssessments', JSON.stringify(filtered));
        return true;
      }
      
      return false;
    } catch (err) {
      errorLog("Error clearing offline assessment:", err);
      return false;
    }
  },
  
  /**
   * Save assessment to local storage for later sync
   * @param {any} assessment The assessment data to save
   * @returns {boolean} True if saved successfully
   */
  saveAssessmentLocally(assessment: any): boolean {
    try {
      // Get existing assessments or initialize empty array
      const existingAssessments = this.getOfflineAssessments();
      
      // Create a new assessment object with a local ID
      const localAssessment = {
        ...assessment,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      // Add to existing assessments
      existingAssessments.push(localAssessment);
      
      // Save back to localStorage
      localStorage.setItem('offlineAssessments', JSON.stringify(existingAssessments));
      
      devLog("Assessment saved to localStorage for later sync");
      return true;
    } catch (err) {
      errorLog("Error saving to localStorage:", err);
      return false;
    }
  },
  
  /**
   * Attempt to sync offline mentor profiles with the server
   * @returns {Promise<{success: boolean, count: number}>} Result of the sync operation
   */
  async syncOfflineMentorProfiles(): Promise<{ success: boolean, count: number }> {
    try {
      // First check if we're online
      if (!isOnline()) {
        devLog("Device appears to be offline, profile sync aborted");
        return { success: false, count: 0 };
      }
      
      // Get offline profiles from localStorage
      const offlineProfiles = JSON.parse(localStorage.getItem('offlineMentorProfiles') || '[]');
      
      if (offlineProfiles.length === 0) {
        return { success: true, count: 0 };
      }
      
      devLog(`Attempting to sync ${offlineProfiles.length} offline mentor profiles`);
      
      // Verify connection to database before proceeding
      const isConnected = await checkConnection();
      if (!isConnected) {
        devLog("Database connection check failed, profile sync aborted");
        return { success: false, count: 0 };
      }
      
      // Track successfully synced profiles
      const synced = [];
      const failed = [];
      
      // Try to sync each profile
      for (const profile of offlineProfiles) {
        try {
          // Wait for connection check before each save attempt
          const connectionOk = await checkConnection();
          if (!connectionOk) {
            devLog(`Connection lost during sync, pausing sync operation`);
            
            // If we've synced some, report partial success
            if (synced.length > 0) {
              // Remove successfully synced profiles from localStorage
              const remainingProfiles = offlineProfiles.filter(
                (p: any) => !synced.includes(p.id)
              );
              localStorage.setItem('offlineMentorProfiles', JSON.stringify(remainingProfiles));
              
              toast.info(`Synced ${synced.length} profiles. ${offlineProfiles.length - synced.length} remaining for later.`);
              return { success: true, count: synced.length };
            }
            
            return { success: false, count: 0 };
          }
          
          // Save profile using the API
          const response = await api.patch(`/api/mood-mentors/${profile.id}`, profile);
          
          if (response.ok) {
            synced.push(profile.id);
            devLog(`Successfully synced profile for user ${profile.id}`);
          } else {
            failed.push(profile.id);
            errorLog(`Failed to sync profile for user ${profile.id}`);
          }
        } catch (err) {
          errorLog("Error syncing profile:", err);
          failed.push(profile.id);
        }
      }
      
      // Remove successfully synced profiles from localStorage
      if (synced.length > 0) {
        const remainingProfiles = offlineProfiles.filter(
          (p: any) => !synced.includes(p.id)
        );
        localStorage.setItem('offlineMentorProfiles', JSON.stringify(remainingProfiles));
        
        if (synced.length === offlineProfiles.length) {
          toast.success(`Successfully synced ${synced.length} offline profiles`);
        } else {
          toast.info(`Synced ${synced.length} profiles. ${failed.length} still pending.`);
        }
      }
      
      return { 
        success: synced.length > 0, 
        count: synced.length 
      };
    } catch (error) {
      errorLog("Error during profile sync process:", error);
      return { success: false, count: 0 };
    }
  },
  
  /**
   * Check if there are offline mentor profiles waiting to be synced
   */
  hasOfflineMentorProfiles(): boolean {
    try {
      const offlineProfiles = JSON.parse(localStorage.getItem('offlineMentorProfiles') || '[]');
      return offlineProfiles.length > 0;
    } catch (err) {
      errorLog("Error checking offline profiles:", err);
      return false;
    }
  },
  
  /**
   * Get count of offline mentor profiles
   */
  getOfflineMentorProfilesCount(): number {
    try {
      const offlineProfiles = JSON.parse(localStorage.getItem('offlineMentorProfiles') || '[]');
      return offlineProfiles.length;
    } catch (err) {
      errorLog("Error counting offline profiles:", err);
      return 0;
    }
  },
  
  /**
   * Force sync all offline data (both assessments and mentor profiles)
   */
  async forceSyncAll(): Promise<{ 
    success: boolean, 
    assessmentsCount: number,
    profilesCount: number 
  }> {
    const assessmentResult = await this.syncOfflineAssessments();
    const profileResult = await this.syncOfflineMentorProfiles();
    
    return {
      success: assessmentResult.success || profileResult.success,
      assessmentsCount: assessmentResult.count,
      profilesCount: profileResult.count
    };
  },
  
  /**
   * Save assessments to localStorage for offline use
   * @param assessment The assessment data to save
   */
  saveOfflineAssessment(assessment: any): void {
    try {
      // Get existing offline assessments
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      
      // Add the new assessment with a unique ID
      const newAssessment = {
        ...assessment,
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      
      // Add to the array
      offlineAssessments.push(newAssessment);
      
      // Save back to localStorage
      localStorage.setItem('offlineAssessments', JSON.stringify(offlineAssessments));
      
      // Update the UI count
      this.updateOfflineCount();
      
      devLog(`Saved assessment to localStorage. Total offline: ${offlineAssessments.length}`);
      toast.success('Assessment saved locally. Will sync when online.');
    } catch (error) {
      errorLog('Error saving offline assessment:', error);
      toast.error('Failed to save assessment locally.');
    }
  },
  
  /**
   * Update the offline count in the UI
   */
  updateOfflineCount(): void {
    try {
      // Get counts from localStorage
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      const offlineProfiles = JSON.parse(localStorage.getItem('offlineProfiles') || '[]');
      
      // Update the UI
      const offlineCountElement = document.getElementById('offline-count');
      if (offlineCountElement) {
        const total = offlineAssessments.length + offlineProfiles.length;
        offlineCountElement.textContent = `${total} items`;
        offlineCountElement.setAttribute('data-count', total.toString());
        
        // Update the tooltip
        const tooltipElement = document.getElementById('offline-tooltip');
        if (tooltipElement) {
          tooltipElement.textContent = `${offlineAssessments.length} assessments, ${offlineProfiles.length} profiles`;
        }
      }
    } catch (error) {
      errorLog('Error updating offline count:', error);
    }
  },
  
  /**
   * Get the count of offline items
   * @returns The count of offline items
   */
  getOfflineCount(): { total: number, assessments: number, profiles: number } {
    try {
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      const offlineProfiles = JSON.parse(localStorage.getItem('offlineProfiles') || '[]');
      
      return {
        total: offlineAssessments.length + offlineProfiles.length,
        assessments: offlineAssessments.length,
        profiles: offlineProfiles.length
      };
    } catch (error) {
      errorLog('Error getting offline count:', error);
      return { total: 0, assessments: 0, profiles: 0 };
    }
  }
};

export default syncService; 