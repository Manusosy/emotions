import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    // Fetch messages either sent by or received by this user
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        content,
        is_read,
        created_at,
        users!sender_id(id, full_name, role, avatar_url),
        users!recipient_id(id, full_name, role, avatar_url)
      `)
      .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new NextResponse('Failed to fetch messages', { status: 500 });
    }
    
    // Format messages for client consumption
    const formattedMessages = messagesData.map(message => {
      const isOutgoing = message.sender_id === id;
      const senderUser = message.users?.find((u: any) => u.id === message.sender_id);
      const recipientUser = message.users?.find((u: any) => u.id === message.recipient_id);
      const otherUser = isOutgoing ? recipientUser : senderUser;
      
      return {
        id: message.id,
        user_id: id,
        sender_id: message.sender_id,
        sender_type: senderUser?.role || 'unknown',
        sender_name: isOutgoing ? 'You' : (senderUser?.full_name || 'Unknown User'),
        recipient_name: !isOutgoing ? 'You' : (recipientUser?.full_name || 'Unknown User'),
        content: message.content,
        read: message.is_read,
        created_at: message.created_at,
        avatar_url: otherUser?.avatar_url || null
      };
    });
    
    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching patient messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 