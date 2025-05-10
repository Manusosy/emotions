import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Activity, ArrowRight, Brain, HeartPulse, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { errorLog } from "@/utils/environment";
import "./styles.css"; // This will be created if it doesn't exist

// Assessment questions from the image
const stressQuestions = [
  { id: 1, text: "Are you feeling overwhelmed today?", type: "stress" },
  { id: 2, text: "Have you had trouble relaxing recently?", type: "stress" },
  { id: 3, text: "Has anything been bothering you with work or at home?", type: "stress" },
  { id: 4, text: "Did you sleep well last night?", type: "physical" }
];

export default function StressAssessmentModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [combinedScore, setCombinedScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset state when dialog is opened
  const handleOpen = () => {
    setIsOpen(true);
    setCurrentQuestion(0);
    setResponses({});
    setCombinedScore(0);
    setShowResult(false);
  };
  
  // Calculate score whenever responses change
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      const totalScore = Object.values(responses).reduce((acc, score) => acc + score, 0);
      const averageScore = totalScore / Object.keys(responses).length;
      setCombinedScore(averageScore / 10); // Convert to 0-1 scale for easier display
    }
  }, [responses]);
  
  // Handle response slider change
  const handleResponseChange = (value: number[]) => {
    setResponses(prev => ({
      ...prev,
      [stressQuestions[currentQuestion].id]: value[0]
    }));
  };
  
  // Navigate to next question
  const handleNext = () => {
    if (currentQuestion < stressQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };
  
  // Determine color based on stress level
  const getStressColor = () => {
    if (combinedScore < 0.3) return "text-green-500";
    if (combinedScore < 0.6) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Get message based on stress level
  const getStressMessage = () => {
    if (combinedScore < 0.3) return "Your stress levels are low. Keep up the good work!";
    if (combinedScore < 0.6) return "You're experiencing moderate stress. Consider some relaxation techniques.";
    return "Your stress levels are high. Please take time for self-care and consider speaking with a professional.";
  };
  
  // Get emoji based on stress level
  const getStressEmoji = () => {
    if (combinedScore < 0.3) return "😊";
    if (combinedScore < 0.6) return "😐";
    return "😔";
  };
  
  // Handle final submission of the assessment
  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit an assessment");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the current time for last assessment time
      const now = new Date();
      const assessmentTime = now.toISOString();
      
      try {
        // Save stress assessment
        const assessmentResponse = await api.post('/api/stress-assessments', {
          user_id: user.id,
          stress_score: combinedScore,
          responses: responses,
          created_at: assessmentTime
        });
        
        if (!assessmentResponse.ok) {
          throw new Error('Failed to save assessment');
        }
        
        // Check if user_assessment_metrics exists and update it
        const metricsCheckResponse = await api.get(`/api/assessment-metrics/${user.id}`);
        
        // If metrics exist, update them, otherwise create new
        if (metricsCheckResponse.ok) {
          // Update existing metrics
          await api.put(`/api/assessment-metrics/${user.id}`, {
            last_assessment_date: assessmentTime,
            stress_level: combinedScore,
            stress_trend: 0 // Default to no trend initially
          });
        } else {
          // Create new metrics if they don't exist
          await api.post('/api/assessment-metrics', {
            user_id: user.id,
            last_assessment_date: assessmentTime,
            stress_level: combinedScore,
            streak: 1,
            first_check_in_date: assessmentTime
          });
        }
        
        // Show completion message
        toast.success("Assessment completed successfully!");
        setIsOpen(false);
      } catch (error: any) {
        errorLog('Error saving stress assessment:', error);
        // If it's a schema error, display a more specific message
        if (error.message && error.message.includes('column')) {
          toast.error("There was an issue with the database schema. Please try again later.");
        } else {
          toast.error("Failed to save your assessment. Please try again.");
        }
      }
    } catch (error) {
      errorLog('Error in stress assessment:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={handleOpen}
          className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600"
        >
          <Activity className="mr-2 h-4 w-4" />
          Take Stress Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {!showResult 
              ? `Question ${currentQuestion + 1}/${stressQuestions.length}` 
              : "Your Stress Assessment"
            }
          </DialogTitle>
        </DialogHeader>
        
        {!showResult ? (
          <div className="space-y-6 py-4">
            <p className="text-lg">{stressQuestions[currentQuestion].text}</p>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Not at all</span>
                <span>Very much</span>
              </div>
              <Slider
                defaultValue={[responses[stressQuestions[currentQuestion].id] || 5]}
                max={10}
                step={1}
                onValueChange={handleResponseChange}
              />
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  {stressQuestions[currentQuestion].type === "stress" ? "Low stress" : "Poor"}
                </span>
                <span className="text-sm font-medium">
                  {responses[stressQuestions[currentQuestion].id] || 5}/10
                </span>
                <span className="text-sm text-gray-500">
                  {stressQuestions[currentQuestion].type === "stress" ? "High stress" : "Good"}  
                </span>
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleNext}
              disabled={!responses[stressQuestions[currentQuestion].id]}
            >
              {currentQuestion < stressQuestions.length - 1 ? "Next" : "View Results"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-6xl">{getStressEmoji()}</div>
              <div className="bg-gray-100 rounded-full px-3 py-1 text-sm">
                <span>Stress Level: </span>
                <span className={getStressColor()}>
                  {Math.round(combinedScore * 100)}%
                </span>
              </div>
              <p>{getStressMessage()}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${combinedScore * 100}%`,
                    backgroundColor: combinedScore < 0.3 ? '#22c55e' : combinedScore < 0.6 ? '#eab308' : '#ef4444'
                  }}
                ></div>
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Assessment"}
              <HeartPulse className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 