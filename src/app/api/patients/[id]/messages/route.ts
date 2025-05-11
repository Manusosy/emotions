import { NextResponse } from 'next/server';
import { subHours, subDays, format } from 'date-fns';

// Generate mock messages with realistic timestamps
const generateMockMessages = (patientId: string) => {
  const now = new Date();
  const messages = [];
  
  // Message from today
  messages.push({
    id: `msg_${patientId}_1`,
    user_id: patientId,
    sender_id: 'amb_12345',
    sender_type: 'ambassador',
    sender_name: 'Dr. Emily Chen',
    content: 'Hi there! Just checking in before our appointment tomorrow. Please let me know if you have any questions.',
    read: true,
    created_at: format(subHours(now, 2), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  });
  
  // Reply from patient
  messages.push({
    id: `msg_${patientId}_2`,
    user_id: patientId,
    sender_id: patientId,
    sender_type: 'patient',
    sender_name: 'You',
    content: 'Thanks for checking in! I\'m looking forward to our session. I\'ll make sure to prepare my questions.',
    read: true,
    created_at: format(subHours(now, 1), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  });
  
  // Message from yesterday
  messages.push({
    id: `msg_${patientId}_3`,
    user_id: patientId,
    sender_id: 'amb_54321',
    sender_type: 'ambassador',
    sender_name: 'Dr. Michael Rodriguez',
    content: 'I\'ve reviewed your progress from our last session. You\'re doing great with the breathing exercises!',
    read: true,
    created_at: format(subDays(now, 1), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  });
  
  return messages;
};

/**
 * GET /api/patients/[id]/messages
 * Retrieve messages for a patient
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Generate mock messages for this patient
    const messages = generateMockMessages(id);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 