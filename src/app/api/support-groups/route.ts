import { NextResponse } from 'next/server';
import { addDays, format } from 'date-fns';

/**
 * GET /api/support-groups
 * Retrieve available support groups
 */
export async function GET(request: Request) {
  try {
    const today = new Date();
    
    // Mock support groups data
    const supportGroups = [
      {
        id: 'group_1',
        name: 'Anxiety Support Circle',
        description: 'A safe space to share experiences and coping strategies for anxiety.',
        facilitator: 'Dr. Sarah Collins',
        meetingTime: format(addDays(today, 2), 'yyyy-MM-dd') + ' 18:00-19:30',
        location: 'Online (Zoom)',
        members: 12,
        status: 'upcoming'
      },
      {
        id: 'group_2',
        name: 'Stress Management Workshop',
        description: 'Learn practical techniques to manage everyday stress and build resilience.',
        facilitator: 'Mark Johnson, LCSW',
        meetingTime: format(addDays(today, 5), 'yyyy-MM-dd') + ' 17:00-18:30',
        location: 'Community Center, Room 203',
        members: 8,
        status: 'upcoming'
      },
      {
        id: 'group_3',
        name: 'Mindfulness Meditation Group',
        description: 'Regular meditation practice with guidance for beginners and experienced practitioners.',
        facilitator: 'Lisa Wong, CPC',
        meetingTime: 'Every Monday, 19:00-20:00',
        location: 'Online (Zoom)',
        members: 15,
        status: 'recurring'
      }
    ];
    
    return NextResponse.json(supportGroups);
  } catch (error) {
    console.error('Error fetching support groups:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 