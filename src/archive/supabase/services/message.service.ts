/**
 * Mock Message Service
 * 
 * This file provides a mock implementation of the message service
 * that was previously using Supabase. It simulates messaging functionality
 * without an actual database connection.
 */

import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// Mock conversation and message data
const mockConversations = [
  {
    id: 'conv-1',
    participants: ['mock-profile-1', 'patient-1'],
    created_at: '2023-10-01T10:00:00.000Z',
    updated_at: '2023-10-25T16:45:00.000Z',
    last_message: 'How are you feeling today?',
    last_message_time: '2023-10-25T16:45:00.000Z',
    unread_count: 1
  },
  {
    id: 'conv-2',
    participants: ['mock-profile-1', 'patient-2'],
    created_at: '2023-09-15T14:30:00.000Z',
    updated_at: '2023-10-24T09:20:00.000Z',
    last_message: 'Remember to complete your journal entry',
    last_message_time: '2023-10-24T09:20:00.000Z',
    unread_count: 0
  }
];

const mockMessages = [
  // Conversation 1
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'patient-1',
    recipient_id: 'mock-profile-1',
    content: 'Hello, I\'ve been feeling anxious lately',
    created_at: '2023-10-25T16:30:00.000Z',
    read: true,
    attachments: []
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'mock-profile-1',
    recipient_id: 'patient-1',
    content: 'I understand that must be difficult. Can you tell me more about when you feel most anxious?',
    created_at: '2023-10-25T16:35:00.000Z',
    read: true,
    attachments: []
  },
  {
    id: 'msg-3',
    conversation_id: 'conv-1',
    sender_id: 'patient-1',
    recipient_id: 'mock-profile-1',
    content: 'Usually in the morning and when I have meetings at work.',
    created_at: '2023-10-25T16:40:00.000Z',
    read: true,
    attachments: []
  },
  {
    id: 'msg-4',
    conversation_id: 'conv-1',
    sender_id: 'mock-profile-1',
    recipient_id: 'patient-1',
    content: 'How are you feeling today?',
    created_at: '2023-10-25T16:45:00.000Z',
    read: false,
    attachments: []
  },
  // Conversation 2
  {
    id: 'msg-5',
    conversation_id: 'conv-2',
    sender_id: 'mock-profile-1',
    recipient_id: 'patient-2',
    content: 'How did the breathing exercises work for you?',
    created_at: '2023-10-24T09:15:00.000Z',
    read: true,
    attachments: []
  },
  {
    id: 'msg-6',
    conversation_id: 'conv-2',
    sender_id: 'patient-2',
    recipient_id: 'mock-profile-1',
    content: 'They helped a lot, thank you!',
    created_at: '2023-10-24T09:18:00.000Z',
    read: true,
    attachments: []
  },
  {
    id: 'msg-7',
    conversation_id: 'conv-2',
    sender_id: 'mock-profile-1',
    recipient_id: 'patient-2',
    content: 'Remember to complete your journal entry',
    created_at: '2023-10-24T09:20:00.000Z',
    read: true,
    attachments: []
  }
];

/**
 * Service to handle messaging functionality
 */
class MessageService {
  /**
   * Get all conversations for a user
   * @param userId The ID of the user
   * @returns A list of conversations
   */
  async getConversationsForUser(userId: string) {
    console.log(`Getting conversations for user ${userId}`);
    
    // Filter conversations where the user is a participant
    const conversations = mockConversations.filter(
      conv => conv.participants.includes(userId)
    );
    
    return { data: conversations, error: null };
  }
  
  /**
   * Get all messages for a conversation
   * @param conversationId The ID of the conversation
   * @returns A list of messages
   */
  async getMessagesByConversation(conversationId: string) {
    console.log(`Getting messages for conversation ${conversationId}`);
    
    // Filter messages by conversation
    const messages = mockMessages.filter(
      msg => msg.conversation_id === conversationId
    ).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return { data: messages, error: null };
  }
  
  /**
   * Send a new message
   * @param senderId The ID of the sender
   * @param recipientId The ID of the recipient
   * @param content The message content
   * @param conversationId Optional existing conversation ID
   * @param attachments Optional attachments
   * @returns The created message
   */
  async sendMessage(
    senderId: string, 
    recipientId: string, 
    content: string, 
    conversationId?: string,
    attachments?: string[]
  ) {
    console.log(`Sending message from ${senderId} to ${recipientId}`);
    
    let targetConversationId = conversationId;
    
    // If no conversation ID is provided, check if there's an existing conversation
    if (!targetConversationId) {
      const existingConversation = mockConversations.find(
        conv => conv.participants.includes(senderId) && conv.participants.includes(recipientId)
      );
      
      if (existingConversation) {
        targetConversationId = existingConversation.id;
      } else {
        // Create a new conversation
        const newConversation = {
          id: `conv-${mockConversations.length + 1}`,
          participants: [senderId, recipientId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: content,
          last_message_time: new Date().toISOString(),
          unread_count: 1
        };
        
        mockConversations.push(newConversation);
        targetConversationId = newConversation.id;
      }
    }
    
    // Update the conversation
    const conversationIndex = mockConversations.findIndex(conv => conv.id === targetConversationId);
    if (conversationIndex >= 0) {
      mockConversations[conversationIndex] = {
        ...mockConversations[conversationIndex],
        last_message: content,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: mockConversations[conversationIndex].unread_count + 1
      };
    }
    
    // Create the new message
    const newMessage = {
      id: `msg-${mockMessages.length + 1}`,
      conversation_id: targetConversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      content,
      created_at: new Date().toISOString(),
      read: false,
      attachments: attachments || []
    };
    
    mockMessages.push(newMessage);
    
    return { data: newMessage, error: null };
  }
  
  /**
   * Mark messages as read
   * @param messageIds List of message IDs to mark as read
   * @returns Success status
   */
  async markMessagesAsRead(messageIds: string[]) {
    console.log(`Marking messages as read: ${messageIds.join(', ')}`);
    
    let conversationId = null;
    
    // Update read status for each message
    messageIds.forEach(msgId => {
      const messageIndex = mockMessages.findIndex(msg => msg.id === msgId);
      if (messageIndex >= 0) {
        mockMessages[messageIndex].read = true;
        conversationId = mockMessages[messageIndex].conversation_id;
      }
    });
    
    // Update unread count for the conversation
    if (conversationId) {
      const conversationIndex = mockConversations.findIndex(conv => conv.id === conversationId);
      if (conversationIndex >= 0) {
        mockConversations[conversationIndex].unread_count = 0;
      }
    }
    
    return { success: true, error: null };
  }
  
  /**
   * Delete a message
   * @param messageId The ID of the message to delete
   * @returns Success status
   */
  async deleteMessage(messageId: string) {
    console.log(`Deleting message ${messageId}`);
    
    const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex >= 0) {
      mockMessages.splice(messageIndex, 1);
      return { success: true, error: null };
    }
    
    return { success: false, error: { message: 'Message not found' } };
  }
}

export const messageService = new MessageService(); 