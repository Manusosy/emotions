export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryData {
  content: string;
  mood: string;
  userId: string;
}

export const journalService = {
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    const response = await fetch(`/api/journal-entries?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch journal entries');
    }
    return response.json();
  },

  async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
    const response = await fetch('/api/journal-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create journal entry');
    }
    return response.json();
  },

  async updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
    const response = await fetch(`/api/journal-entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update journal entry');
    }
    return response.json();
  },

  async deleteJournalEntry(id: string): Promise<void> {
    const response = await fetch(`/api/journal-entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete journal entry');
    }
  },
}; 