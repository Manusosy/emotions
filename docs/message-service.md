# Message Service Architecture

This document explains the message service architecture implemented in the Emotions App as a replacement for Supabase's real-time messaging functionality.

## Overview

The message service provides a centralized mechanism for handling chat functionality in the application, using the API client for data fetching and the notification service for real-time updates. This approach improves security, provides consistent error handling, and enables real-time communication without Supabase dependencies.

## Key Features

1. **REST API Integration**:
   - Uses the standardized API client for all message operations
   - Consistent error handling with fetchWithErrorHandling utility
   - Proper logging with devLog and errorLog utilities

2. **Real-time Updates**:
   - Integrates with the notification service for real-time message delivery
   - Configurable polling intervals for different chat scenarios
   - Smart subscription management with automatic cleanup

3. **Conversation Management**:
   - Create conversations between patients and mood mentors
   - Fetch conversation history with proper pagination
   - Mark messages as read with server synchronization

4. **Component Integration**:
   - Clean component integration in both patient and mood mentor interfaces
   - Optimistic UI updates for improved user experience
   - Proper cleanup of subscriptions to prevent memory leaks

## Architecture

### Components

1. **MessageService Class**:
   - Singleton instance handling all messaging operations
   - Provides typed interfaces for messages and conversations
   - Manages the connection between UI and backend

2. **Notification Service Integration**:
   - Uses the notification service for subscription management
   - Implements conversation-specific subscription patterns
   - Handles message delivery with minimal latency

3. **MessagesPage Components**:
   - Patient dashboard version focusing on communicating with mood mentors
   - Mood mentor version focusing on managing patient communications
   - Both using identical service patterns for consistency

### Flow Diagram

```
┌─────────────────┐      Subscribe      ┌───────────────────┐
│                 │─────────────────────▶                   │
│  MessagesPage   │                     │  MessageService   │
│  Component      │◀─────────────────────                   │
└─────────────────┘    Message Updates  └───────────────────┘
                                                  │
                                                  │ Subscribe
                                                  ▼
                                        ┌───────────────────┐
                                        │                   │
                                        │NotificationService│
                                        │                   │
                                        └───────────────────┘
                                                  │
                                                  │ Poll
                                                  ▼
                                        ┌───────────────────┐
                                        │                   │
                                        │    API Client     │
                                        │                   │
                                        └───────────────────┘
                                                  │
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │                   │
                                        │   Backend API     │
                                        │                   │
                                        └───────────────────┘
```

## Usage

### Basic Conversation Fetching

```typescript
import { useEffect, useState } from 'react';
import { messageService, Conversation } from '@/services/messageService';
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const conversationsData = await messageService.getConversations(user.id);
        setConversations(conversationsData);
      } catch (error) {
        errorLog('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, [user]);
  
  // ...
}
```

### Real-time Message Subscription

```typescript
import { useEffect, useRef } from 'react';
import { messageService, ChatMessage } from '@/services/messageService';

function ChatComponent({ conversationId, userId }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const subscriptionIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Initial message fetch
    const fetchMessages = async () => {
      const messagesData = await messageService.getMessages(conversationId);
      setMessages(messagesData);
    };
    
    fetchMessages();
    
    // Subscribe to real-time updates
    const handleNewMessages = (data: ChatMessage[]) => {
      // Update messages state with new messages
      // ...
    };
    
    subscriptionIdRef.current = messageService.subscribeToConversation(
      conversationId,
      userId,
      handleNewMessages
    );
    
    // Cleanup
    return () => {
      if (subscriptionIdRef.current) {
        messageService.unsubscribeFromConversation(
          subscriptionIdRef.current,
          conversationId,
          userId
        );
      }
    };
  }, [conversationId, userId]);
  
  // ...
}
```

## API Reference

### Core Methods

1. **getConversations(userId: string): Promise<Conversation[]>**
   - Fetches all conversations for a user
   - Returns properly formatted conversation objects

2. **getMessages(conversationId: string): Promise<ChatMessage[]>**
   - Fetches all messages for a specific conversation
   - Returns messages sorted by creation time

3. **sendMessage(conversationId: string, senderId: string, recipientId: string, content: string): Promise<ChatMessage | null>**
   - Sends a new message in a conversation
   - Returns the created message object

4. **markAsRead(conversationId: string, userId: string): Promise<boolean>**
   - Marks all messages as read for a user in a conversation
   - Returns success status

5. **subscribeToConversation(conversationId: string, userId: string, callback?: (data: any) => void): string**
   - Subscribes to real-time updates for a conversation
   - Returns a subscription ID for cleanup

### Data Types

```typescript
interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  attachments?: string[];
}

interface Conversation {
  id: string;
  patient_id: string;
  ambassador_id: string;
  created_at: string;
  last_message_at?: string;
  messages?: ChatMessage[];
}
```

## Best Practices

1. **Always clean up subscriptions** when components unmount to prevent memory leaks
2. **Handle optimistic updates** when sending messages for better user experience
3. **Use proper error handling** for network failures
4. **Include UI feedback** for message sending and delivery status

## Migration from Supabase

If your component is currently using Supabase's real-time subscriptions:

1. Replace Supabase imports with messageService imports
2. Update message sending to use the messageService.sendMessage method
3. Replace Supabase subscriptions with messageService.subscribeToConversation
4. Add proper cleanup for subscriptions in useEffect return functions

### Before:

```typescript
import { messageService } from '@/integrations/supabase/services/message.service';

// Later in code:
const subscription = messageService.subscribeToConversation(
  conversationId,
  (payload) => {
    const newMessage = payload.new;
    // Update UI with new message
  }
);

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### After:

```typescript
import { messageService } from '@/services/messageService';

// Later in code:
const subscriptionId = messageService.subscribeToConversation(
  conversationId,
  userId,
  (messages) => {
    // Update UI with new messages
  }
);

// Cleanup
return () => {
  messageService.unsubscribeFromConversation(
    subscriptionId,
    conversationId,
    userId
  );
};
``` 