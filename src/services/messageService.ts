/**
 * Message Service
 * 
 * This service handles messaging functionality using the API client
 * and integrates with the notification service for real-time updates.
 */

import { api } from '@/lib/api';
import { errorLog, devLog } from '@/utils/environment';
import { fetchWithErrorHandling } from '@/utils/error-handling';
import { notificationService } from '@/lib/notificationService';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  patient_id: string;
  ambassador_id: string;
  created_at: string;
  last_message_at?: string;
  messages?: ChatMessage[];
}

class MessageService {
  /**
   * Get all conversations for a user
   * @param userId The ID of the user
   * @returns A list of conversations
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    devLog(`Getting conversations for user ${userId}`);
    
    const { data, error } = await fetchWithErrorHandling<Conversation[]>(
      () => api.get(`/api/conversations?userId=${userId}`),
      {
        defaultErrorMessage: 'Failed to fetch conversations',
        showErrorToast: false
      }
    );
    
    if (error) {
      errorLog('Error fetching conversations:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Get all messages for a conversation
   * @param conversationId The ID of the conversation
   * @returns A list of messages
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    devLog(`Getting messages for conversation ${conversationId}`);
    
    const { data, error } = await fetchWithErrorHandling<ChatMessage[]>(
      () => api.get(`/api/conversations/${conversationId}/messages`),
      {
        defaultErrorMessage: 'Failed to fetch messages',
        showErrorToast: false
      }
    );
    
    if (error) {
      errorLog('Error fetching messages:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Send a new message
   * @param conversationId The ID of the conversation
   * @param senderId The ID of the sender
   * @param recipientId The ID of the recipient
   * @param content The message content
   * @param attachments Optional attachments
   * @returns The created message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string,
    attachments?: string[]
  ): Promise<ChatMessage | null> {
    devLog(`Sending message from ${senderId} to ${recipientId}`);
    
    const { data, error } = await fetchWithErrorHandling<ChatMessage>(
      () => api.post(`/api/conversations/${conversationId}/messages`, {
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        attachments
      }),
      {
        defaultErrorMessage: 'Failed to send message',
        successMessage: 'Message sent'
      }
    );
    
    if (error) {
      errorLog('Error sending message:', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Create a new conversation
   * @param patientId The ID of the patient
   * @param ambassadorId The ID of the ambassador
   * @param initialMessage Optional initial message
   * @returns The created conversation
   */
  async createConversation(
    patientId: string,
    ambassadorId: string,
    initialMessage?: string
  ): Promise<Conversation | null> {
    devLog(`Creating conversation between patient ${patientId} and ambassador ${ambassadorId}`);
    
    const { data, error } = await fetchWithErrorHandling<Conversation>(
      () => api.post('/api/conversations', {
        patient_id: patientId,
        ambassador_id: ambassadorId,
        initial_message: initialMessage
      }),
      {
        defaultErrorMessage: 'Failed to create conversation',
        successMessage: 'Conversation created'
      }
    );
    
    if (error) {
      errorLog('Error creating conversation:', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Mark messages as read for a user in a conversation
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user marking messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<boolean> {
    devLog(`Marking messages as read for user ${userId} in conversation ${conversationId}`);
    
    const { error } = await fetchWithErrorHandling(
      () => api.put(`/api/conversations/${conversationId}/read`, {
        user_id: userId
      }),
      {
        defaultErrorMessage: 'Failed to mark messages as read',
        showErrorToast: false
      }
    );
    
    if (error) {
      errorLog('Error marking messages as read:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a message
   * @param messageId The ID of the message to delete
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    devLog(`Deleting message ${messageId}`);
    
    const { error } = await fetchWithErrorHandling(
      () => api.delete(`/api/messages/${messageId}`),
      {
        defaultErrorMessage: 'Failed to delete message',
        successMessage: 'Message deleted'
      }
    );
    
    if (error) {
      errorLog('Error deleting message:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Subscribe to messages for a conversation
   * @param conversationId The ID of the conversation
   * @param callback The callback function to call when new messages arrive
   * @returns The subscription ID
   */
  subscribeToConversation(conversationId: string, userId: string, callback?: (data: any) => void): string {
    devLog(`Subscribing to messages for conversation ${conversationId}`);
    
    // Create a subscription ID with both the conversation ID and user ID
    const subscriptionId = notificationService.subscribe(`conversation_${conversationId}`, userId, 10000);
    
    // Add a listener for this specific conversation
    if (callback) {
      notificationService.addListener(`conversation_${conversationId}`, userId, callback);
    }
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from messages for a conversation
   * @param subscriptionId The subscription ID returned from subscribeToConversation
   * @param conversationId The conversation ID
   * @param userId The user ID
   * @param callback The callback function to remove
   */
  unsubscribeFromConversation(subscriptionId: string, conversationId: string, userId: string, callback?: (data: any) => void): void {
    devLog(`Unsubscribing from messages for conversation ${conversationId}`);
    
    // Unsubscribe from the notification service
    notificationService.unsubscribe(subscriptionId);
    
    // Remove the listener if provided
    if (callback) {
      notificationService.removeListener(`conversation_${conversationId}`, userId, callback);
    }
  }
}

export const messageService = new MessageService(); 