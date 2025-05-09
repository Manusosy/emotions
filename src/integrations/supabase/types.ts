export type MoodType = 'Happy' | 'Calm' | 'Sad' | 'Angry' | 'Worried';

export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          mood: MoodType | null;
          mood_score?: number;
          created_at: string;
        };
      };
    };
    Enums: {
      mood_type: MoodType;
    };
  };
}; 