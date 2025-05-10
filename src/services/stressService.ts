import { StressAssessment } from '@prisma/client';

export interface CreateStressAssessmentData {
  userId: string;
  score: number;
  symptoms: string[];
  triggers: string[];
  notes?: string;
}

export const stressService = {
  async getStressAssessments(userId: string): Promise<StressAssessment[]> {
    const response = await fetch(`/api/stress-assessments?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stress assessments');
    }
    return response.json();
  },

  async createStressAssessment(data: CreateStressAssessmentData): Promise<StressAssessment> {
    const response = await fetch('/api/stress-assessments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create stress assessment');
    }
    return response.json();
  },

  async getStressReport(userId: string, startDate?: string, endDate?: string): Promise<{
    averageScore: number;
    totalAssessments: number;
    commonSymptoms: string[];
    commonTriggers: string[];
  }> {
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/stress-report?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stress report');
    }
    return response.json();
  },
}; 