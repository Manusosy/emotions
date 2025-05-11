import { NextResponse } from 'next/server';
import { subDays, format } from 'date-fns';

/**
 * GET /api/patients/[id]/journal-entries
 * Retrieve journal entries for a patient
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const now = new Date();
    
    // Mock journal entries data
    const journalEntries = [
      {
        id: `journal_${id}_1`,
        user_id: id,
        title: 'Feeling More Balanced Today',
        content: '<p>I practiced the breathing techniques we discussed in my last session, and I\'m noticing a difference in how I respond to stress at work. When my boss added another project to my workload, I took a moment to breathe instead of immediately feeling overwhelmed.</p><p>I still have concerns about the deadline, but I feel more capable of handling it step by step.</p>',
        mood: 'Calm',
        created_at: format(subDays(now, 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        updated_at: format(subDays(now, 1), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      },
      {
        id: `journal_${id}_2`,
        user_id: id,
        title: 'Gratitude Reflection',
        content: '<p>Today I\'m focusing on things I\'m grateful for:</p><ul><li>My supportive partner who made me tea this morning</li><li>The sunny weather after days of rain</li><li>Making progress on my project at work</li><li>The helpful session with my therapist yesterday</li></ul><p>I notice that when I list these things out, my mood lifts a bit.</p>',
        mood: 'Grateful',
        created_at: format(subDays(now, 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        updated_at: format(subDays(now, 3), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      },
      {
        id: `journal_${id}_3`,
        user_id: id,
        title: 'Difficult Day',
        content: '<p>I had trouble sleeping last night, which made today challenging. My anxiety was higher than usual, especially during the team meeting. I found myself catastrophizing about the project timeline.</p><p>I need to remember to use the grounding techniques when I notice my thoughts spiraling. Going to try to get better sleep tonight by avoiding screens before bed.</p>',
        mood: 'Anxious',
        created_at: format(subDays(now, 6), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        updated_at: format(subDays(now, 6), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      }
    ];
    
    return NextResponse.json(journalEntries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 