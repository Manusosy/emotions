/**
 * Type definitions for the stress assessment system
 */

/**
 * Represents a single stress assessment entry
 */
export interface StressAssessment {
  id: string;
  userId: string;
  score: number; // 0-10 scale (higher = more stress)
  symptoms: string[];
  triggers: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  responses?: AssessmentResponse[]; // Optional detailed responses
}

/**
 * Represents a response to a single assessment question
 */
export interface AssessmentResponse {
  id?: number;
  questionId: number;
  questionType: string; // 'stress', 'physical', etc.
  score: number; // 0-10 scale
}

/**
 * Represents a question in the stress assessment
 */
export interface AssessmentQuestion {
  id: number;
  text: string;
  type: string; // 'stress', 'physical', etc.
  helpText?: string; // Optional guidance text
}

/**
 * User assessment metrics for dashboard display
 */
export interface AssessmentMetrics {
  userId: string;
  stressLevel: number; // Current stress level (0-10)
  lastAssessmentDate: string;
  streakCount: number; // Consecutive days of assessments
  consistencyScore: number; // 0-100 percentage
  trend: 'improving' | 'declining' | 'stable';
  firstCheckInDate: string;
}

/**
 * Data required to create a new stress assessment
 */
export interface CreateStressAssessmentData {
  userId: string;
  score: number;
  symptoms: string[];
  triggers: string[];
  notes?: string;
  responses?: AssessmentResponse[];
}

/**
 * Standard stress assessment questions
 */
export const STANDARD_STRESS_QUESTIONS: AssessmentQuestion[] = [
  { id: 1, text: "Are you feeling overwhelmed today?", type: "stress", helpText: "Consider your overall mental state" },
  { id: 2, text: "Have you had trouble relaxing recently?", type: "stress", helpText: "Think about the past few days" },
  { id: 3, text: "Has anything been bothering you with work or at home?", type: "stress", helpText: "Consider all aspects of your life" },
  { id: 4, text: "Did you sleep well last night?", type: "physical", helpText: "Consider both quality and duration" },
  { id: 5, text: "How is your energy level today?", type: "physical", helpText: "Compare to your normal baseline" },
  { id: 6, text: "Are you experiencing physical tension or discomfort?", type: "physical", helpText: "Consider muscle tension, headaches, etc." },
  { id: 7, text: "How would you rate your ability to focus today?", type: "cognitive", helpText: "Consider your concentration and attention" },
  { id: 8, text: "Do you feel supported by friends and family?", type: "social", helpText: "Consider your social connections" }
]; 