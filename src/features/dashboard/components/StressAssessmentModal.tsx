import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Activity, ArrowRight, ArrowLeft, CheckCircle, CloudOff, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { errorLog } from "@/utils/environment";
import { Progress } from "@/components/ui/progress";
import { 
  AssessmentQuestion, 
  AssessmentResponse, 
  STANDARD_STRESS_QUESTIONS 
} from "@/types/stress-assessment.types";
import syncService from "@/services/syncService";
import { saveStressAssessment } from "@/lib/db-direct";
import { debugLocalAssessments, forceSync } from "@/utils/assessment-storage-check";
import { isOnline } from "@/utils/network";
import "./styles.css";
import { supabase } from "@/lib/supabase";
import ConnectionStatus from '@/components/ConnectionStatus';
import { useConnection } from '@/contexts/ConnectionContext';

// Common symptoms and triggers for stress
const COMMON_SYMPTOMS = [
  "Anxiety", "Restlessness", "Fatigue", "Difficulty concentrating", 
  "Irritability", "Muscle tension", "Sleep problems", "Headaches"
];

const COMMON_TRIGGERS = [
  "Work pressure", "Financial concerns", "Relationship issues", 
  "Health worries", "Major life changes", "Family responsibilities",
  "Social situations", "Time management"
];

// Brand color
const BRAND_COLOR = "#20C0F3";

// Questions requiring inverted logic (where high score is positive)
const INVERTED_QUESTIONS = [
  "Did you sleep well last night?",
  "How is your energy level today?",
  "Do you feel supported by friends and family?"
];

export default function StressAssessmentModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [combinedScore, setCombinedScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [questions] = useState<AssessmentQuestion[]>(STANDARD_STRESS_QUESTIONS);
  const [healthStatus, setHealthStatus] = useState("");
  const [healthColor, setHealthColor] = useState("#cccccc");
  const [offlineCount, setOfflineCount] = useState(0);
  const { isConnected, connectionStatus, checkConnection } = useConnection();
  
  // Reset state when dialog is opened
  const handleOpen = () => {
    setIsOpen(true);
    setCurrentStep(0);
    setResponses([]);
    setCombinedScore(0);
    setShowResult(false);
    setSymptoms([]);
    setTriggers([]);
    setNotes("");
  };
  
  // Replace the old useEffect hook with this new version
  useEffect(() => {
    const loadOfflineAssessments = async () => {
      // Log stored assessments for debugging
      debugLocalAssessments();
      
      const count = syncService.getOfflineAssessmentCount();
      setOfflineCount(count);
      
      // If connected, check for offline assessments to sync
      if (isConnected && count > 0 && user) {
        try {
          const result = await syncService.syncOfflineAssessments();
          if (result.success) {
            toast.success(`Successfully synced ${result.count} assessment(s)`);
            setOfflineCount(syncService.getOfflineAssessmentCount());
          } else if (result.count > 0) {
            toast.warning(`Partially synced assessments. ${result.count} remaining.`);
            setOfflineCount(result.count);
          }
        } catch (err) {
          console.error("Error syncing assessments:", err);
        }
      } else if (count > 0 && !isConnected) {
        toast.warning(`You have ${count} assessment(s) stored locally. They will sync when connection is restored.`);
      }
    };
    
    loadOfflineAssessments();
  }, [user, isConnected]);
  
  // Calculate score whenever responses change
  useEffect(() => {
    if (responses.length > 0) {
      calculateResults(responses);
    }
  }, [responses]);
  
  // Calculate combined score and health metrics
  const calculateResults = (currentResponses: AssessmentResponse[]) => {
    // Get overall stress score as average of all responses
    let totalScore = 0;
    
    // Normalize responses based on question logic
    currentResponses.forEach(response => {
      const question = questions.find(q => q.id === response.questionId);
      if (question && INVERTED_QUESTIONS.includes(question.text)) {
        // For inverted questions, flip the score (10 - score)
        totalScore += (10 - response.score);
      } else {
        totalScore += response.score;
      }
    });
    
    const averageScore = totalScore / currentResponses.length;
    
    // Set combined score (0-10 scale)
    setCombinedScore(averageScore);
    
    // Set health status based on score
    if (averageScore < 3) {
      setHealthStatus("Low");
      setHealthColor("#4ade80"); // Green
    } else if (averageScore < 6) {
      setHealthStatus("Moderate");
      setHealthColor("#facc15"); // Yellow
    } else {
      setHealthStatus("High");
      setHealthColor("#ef4444"); // Red
    }
  };
  
  // Check if current question has inverted logic (high score is good)
  const isCurrentQuestionInverted = () => {
    return currentQuestion && INVERTED_QUESTIONS.includes(currentQuestion.text);
  };
  
  // Handle score change for a question
  const handleScoreChange = (questionId: number, questionType: string, value: number) => {
    // Convert value to one decimal place (instead of whole numbers)
    const roundedValue = Math.round(value * 10) / 10;
    
    // Find if there's an existing response for this question
    const existingResponseIndex = responses.findIndex(r => r.questionId === questionId);
    
    if (existingResponseIndex >= 0) {
      // Update existing response
      const updatedResponses = [...responses];
      updatedResponses[existingResponseIndex] = { 
        ...updatedResponses[existingResponseIndex], 
        score: roundedValue 
      };
      setResponses(updatedResponses);
    } else {
      // Add new response
      setResponses([
        ...responses, 
        { questionId, questionType, score: roundedValue }
      ]);
    }
  };
  
  // Handle selecting a symptom
  const handleSymptomToggle = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };
  
  // Handle selecting a trigger
  const handleTriggerToggle = (trigger: string) => {
    if (triggers.includes(trigger)) {
      setTriggers(triggers.filter(t => t !== trigger));
    } else {
      setTriggers([...triggers, trigger]);
    }
  };
  
  // Navigate to next step
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };
  
  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Get message based on stress level
  const getStressMessage = () => {
    if (combinedScore < 3) return "Your stress levels are low. Keep up the good work!";
    if (combinedScore < 6) return "You're experiencing moderate stress. Consider some relaxation techniques.";
    return "Your stress levels are high. Please take time for self-care.";
  };
  
  // Get emoji based on stress level
  const getStressEmoji = () => {
    if (combinedScore < 3) return "😊";
    if (combinedScore < 6) return "😐";
    return "😔";
  };
  
  // Get the current question
  const currentQuestion = questions[currentStep];
  const currentResponse = responses.find(r => r.questionId === currentQuestion?.id);
  
  // Simplified version for fallback storage
  const saveToLocalStorage = () => {
    try {
      // Get existing assessments or initialize empty array
      const savedAssessments = JSON.parse(localStorage.getItem('offlineAssessments') || '[]');
      
      // Create simplified assessment object
      const simplifiedAssessment = {
        id: `local-${Date.now()}`,
        userId: user?.id,
        score: combinedScore,
        symptoms,
        triggers,
        notes: "",
        createdAt: new Date().toISOString(),
        responses
      };
      
      // Add to existing assessments
      savedAssessments.push(simplifiedAssessment);
      
      // Save back to localStorage
      localStorage.setItem('offlineAssessments', JSON.stringify(savedAssessments));
      
      console.log("Assessment saved to localStorage for later sync");
      return true;
    } catch (err) {
      console.error("Error saving to localStorage:", err);
      return false;
    }
  };

  // Submit the assessment to the database
  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit an assessment");
      return;
    }

    setIsSubmitting(true);
    console.log("[Submit] Starting submission process...");
    
    try {
      // Format response data to ensure it's properly structured
      const formattedResponses = responses.map(response => ({
        questionId: response.questionId,
        questionType: response.questionType,
        score: Number(response.score.toFixed(1)) // Ensure score is a number with 1 decimal place
      }));
      
      // Prepare data for submission with proper formatting
      const assessmentData = {
        userId: user.id,
        score: Number(combinedScore.toFixed(1)), // Use one decimal place for consistency
        symptoms: symptoms.length > 0 ? symptoms : [], 
        triggers: triggers.length > 0 ? triggers : [], 
        notes: notes || "", 
        responses: formattedResponses
      };
      
      console.log("[Submit] Prepared assessment data:", assessmentData);
      
      let savedToDatabase = false;
      
      // Try to save to database if we're connected
      if (isConnected) {
        try {
          console.log("[Submit] Connected to server, attempting database save");
          const result = await saveStressAssessment(assessmentData);
          
          if (result && !result.error) {
            console.log("[Submit] Successfully saved to database:", result);
            savedToDatabase = true;
            toast.success("Assessment saved successfully!");
            
            // If we successfully saved to database and have offline assessments, try to sync them
            if (syncService.hasOfflineAssessments()) {
              console.log("[Submit] Syncing offline assessments after successful save");
              try {
                const syncResult = await syncService.syncOfflineAssessments();
                if (syncResult.success) {
                  setOfflineCount(syncService.getOfflineAssessmentCount());
                  if (syncResult.count > 0) {
                    toast.success(`Also synced ${syncResult.count} offline assessment(s)`);
                  }
                }
              } catch (syncError) {
                console.error("[Submit] Sync error after successful save:", syncError);
              }
            }
            
            // Reset state and close modal on successful save
            setIsOpen(false);
            setResponses([]);
            setCombinedScore(0);
            setShowResult(false);
            setSymptoms([]);
            setTriggers([]);
            setNotes("");
          } else {
            console.error("[Submit] Database returned error:", result?.error);
            throw new Error(result?.error?.message || "Failed to save to database");
          }
        } catch (dbError) {
          console.error("[Submit] Database save error:", dbError);
          savedToDatabase = false;
        }
      } else {
        console.log("[Submit] Not connected to server, skipping database save attempt");
      }
      
      // If we couldn't save to the database, save locally
      if (!savedToDatabase) {
        console.log("[Submit] Saving to local storage as fallback");
        
        try {
          const localSaved = syncService.saveAssessmentLocally(assessmentData);
          
          if (localSaved) {
            setOfflineCount(prevCount => prevCount + 1);
            
            // Show appropriate message based on connection state
            if (!isConnected) {
              toast.info("You appear to be offline. Assessment saved locally and will sync when connection is restored.");
            } else {
              toast.warning("Could not connect to the database. Assessment has been saved locally and will sync when the server is available.");
            }
            
            // Still advance to results view
            setShowResult(true);
          } else {
            toast.error("Failed to save assessment. Please try again later.");
          }
        } catch (localError) {
          console.error("[Submit] Local storage error:", localError);
          toast.error("Failed to save assessment. Please check your connection and try again.");
        }
      }
    } catch (error) {
      console.error("[Submit] General error:", error);
      toast.error("An error occurred while saving your assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = showResult 
    ? 100 
    : Math.round(((currentStep + 1) / questions.length) * 100);

  // Get left and right label text based on question
  const getSliderLabels = () => {
    if (!currentQuestion) return { left: "Not at all", right: "Very much" };
    
    const isInverted = isCurrentQuestionInverted();
    
    if (currentQuestion.text === "Did you sleep well last night?") {
      return { 
        left: isInverted ? "Not at all" : "Very well", 
        right: isInverted ? "Very well" : "Not at all" 
      };
    }
    
    if (currentQuestion.text === "How is your energy level today?") {
      return { 
        left: isInverted ? "Very low" : "Very high", 
        right: isInverted ? "Very high" : "Very low" 
      };
    }
    
    if (currentQuestion.text.includes("supported by friends")) {
      return { 
        left: isInverted ? "Not supported" : "Well supported", 
        right: isInverted ? "Well supported" : "Not supported" 
      };
    }
    
    // Default labels
    return { 
      left: isInverted ? "Poor" : "Good", 
      right: isInverted ? "Good" : "Poor" 
    };
  };

  const { left: leftLabel, right: rightLabel } = getSliderLabels();

  // Handle manual sync of offline assessments
  const handleSyncNow = async () => {
    if (!user) {
      toast.error("You must be logged in to sync assessments");
      return;
    }
    
    try {
      const result = await forceSync();
      if (result) {
        // Refresh offline count
        setOfflineCount(syncService.getOfflineAssessmentCount());
      }
    } catch (error) {
      console.error("Error syncing assessments:", error);
      toast.error("Failed to sync assessments. Please try again later.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button 
            onClick={handleOpen}
            className="text-white rounded-lg relative"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            <Activity className="mr-2 h-4 w-4" />
            Take Stress Assessment
            {offlineCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                <CloudOff className="w-3 h-3" />
              </div>
            )}
          </Button>
        </DialogTrigger>
        
        {offlineCount > 0 && (
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-lg border-amber-500 text-amber-500 hover:bg-amber-50"
            onClick={handleSyncNow}
            title="Sync offline assessments"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl">
        {/* Add ConnectionStatus component at the top */}
        <ConnectionStatus className="m-2 mt-0" />
        
        {/* Existing offline connection indicator - can be removed if you want to use only ConnectionStatus */}
        {connectionStatus === 'disconnected' && (
          <div className="w-full bg-yellow-100 p-2 text-center text-xs font-medium text-yellow-800">
            <CloudOff className="inline-block w-3 h-3 mr-1" />
            Connection to server unavailable. You can still complete the assessment.
          </div>
        )}
        
        {/* Progress bar at the top */}
        <div className="w-full h-1.5 bg-gray-100 rounded-t-xl">
          <div 
            className="h-full rounded-tl-xl transition-all duration-300 ease-in-out" 
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: BRAND_COLOR
            }}
          />
        </div>

        {!showResult ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold">Question {currentStep + 1}/{questions.length}</h3>
                <p className="text-sm text-gray-500">Answer honestly for accurate results</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                {currentStep + 1}
              </div>
            </div>

            <div className="py-4">
              <h2 className="text-lg font-medium mb-2">{currentQuestion.text}</h2>
              {currentQuestion.helpText && (
                <p className="text-sm text-gray-500 mb-6">{currentQuestion.helpText}</p>
              )}
              
              <div className="space-y-8 mt-6">
                <div className="w-full px-1">
                  <Slider
                    defaultValue={[currentResponse?.score || 5]}
                    max={10}
                    step={0.1}
                    className={isCurrentQuestionInverted() ? "assessment-slider-inverted" : "assessment-slider"}
                    onValueChange={(values) => handleScoreChange(currentQuestion.id, currentQuestion.type, values[0])}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${isCurrentQuestionInverted() ? "bg-red-400" : "bg-green-400"}`}></div>
                    <span className="text-sm font-medium">{leftLabel}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-base font-semibold score-display">
                      {currentResponse ? currentResponse.score.toFixed(1) : "5.0"}/10
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${isCurrentQuestionInverted() ? "bg-green-400" : "bg-red-400"}`}></div>
                    <span className="text-sm font-medium">{rightLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="rounded-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                onClick={handleNext}
                disabled={!currentResponse}
                className="rounded-lg text-white"
                style={{ backgroundColor: BRAND_COLOR }}
              >
                {currentStep < questions.length - 1 ? "Next" : "View Results"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-center mb-6">Your Stress Assessment Results</h3>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col items-center mb-6">
                <div className="text-5xl mb-4">{getStressEmoji()}</div>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-50 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: healthColor }}></div>
                  <span className="font-medium">{healthStatus} Stress Level ({Math.round(combinedScore * 10)}%)</span>
                </div>
                <p className="text-center text-gray-600">{getStressMessage()}</p>
              </div>

              {/* Progress bar visualization */}
              <div className="w-full mb-8">
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${combinedScore * 10}%`, backgroundColor: healthColor }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Low stress</span>
                  <span className="text-xs text-gray-500">High stress</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  Common symptoms you're experiencing
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        symptoms.includes(symptom)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mr-2"></div>
                  What's triggering your stress
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TRIGGERS.map((trigger) => (
                    <button
                      key={trigger}
                      type="button"
                      onClick={() => handleTriggerToggle(trigger)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        triggers.includes(trigger)
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              </div>
              
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <Button 
                className="w-full rounded-lg h-12 text-white"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ backgroundColor: BRAND_COLOR }}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    Saving Assessment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 