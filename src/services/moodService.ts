import { MoodEntry } from '@prisma/client';

export interface MoodSummary {
  totalEntries: number;
  averageScore: number;
  lastAssessment: string | null;
  mostFrequentMood: string;
  streakDays: number;
}

export const moodService = {
  async getMoodEntries(userId: string): Promise<MoodEntry[]> {
    const response = await fetch(`/api/mood-entries?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch mood entries');
    }
    return response.json();
  },

  async getMoodSummary(userId: string): Promise<MoodSummary> {
    const response = await fetch(`/api/mood-summary?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch mood summary');
    }
    return response.json();
  },

  async createMoodEntry(userId: string, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const response = await fetch('/api/mood-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...data }),
    });
    if (!response.ok) {
      throw new Error('Failed to create mood entry');
    }
    return response.json();
  },

  async updateMoodEntry(id: string, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const response = await fetch(`/api/mood-entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update mood entry');
    }
    return response.json();
  },

  async deleteMoodEntry(id: string): Promise<void> {
    const response = await fetch(`/api/mood-entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete mood entry');
    }
  }
}; 