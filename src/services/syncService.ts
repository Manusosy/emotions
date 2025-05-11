import { toast } from "sonner";
import supabaseClient from "@/lib/supabase";

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
      // Get offline assessments from localStorage
      const offlineAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      
      if (offlineAssessments.length === 0) {
        return { success: true, count: 0 };
      }
      
      console.log(`Attempting to sync ${offlineAssessments.length} offline assessments`);
      
      // Track successfully synced assessments
      const synced = [];
      const failed = [];
      
      // Try to sync each assessment
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
          
          // Save directly using Supabase
          await supabaseClient.saveStressAssessment(formattedData);
          synced.push(assessment.id);
        } catch (err) {
          console.error("Error syncing assessment:", err);
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
      }
      
      return { 
        success: synced.length > 0, 
        count: synced.length 
      };
    } catch (error) {
      console.error("Error during sync process:", error);
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
      console.error("Error checking offline assessments:", err);
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
      console.error("Error counting offline assessments:", err);
      return 0;
    }
  }
};

export default syncService; 