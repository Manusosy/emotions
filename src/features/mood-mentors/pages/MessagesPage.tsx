import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { ConversationList, ConversationItem } from "@/components/messaging/ConversationList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { messageService, ChatMessage } from "@/services/messageService";
import { Loader2, Search, Send, MessageSquare, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { fetchWithErrorHandling } from "@/utils/error-handling";
import { errorLog, devLog } from "@/utils/environment";

// Define the UserProfile interface
interface UserProfile {
  full_name: string;
  avatar_url?: string;
  id: string;
  email?: string;
  role?: string;
}

// Define the message interface
interface MessageItem {
  id: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
  senderName: string;
  read: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [otherUserData, setOtherUserData] = useState<any>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  
  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        devLog('Fetching conversations for user:', user.id);
        
        const conversationsData = await messageService.getConversations(user.id);
        
        // Format conversations for UI
        const formattedConversations = await Promise.all(
          conversationsData.map(async (convo) => {
            // Determine if user is patient or ambassador
            const isAmbassador = convo.ambassador_id === user.id;
            const otherUserId = isAmbassador ? convo.patient_id : convo.ambassador_id;
            
            try {
              // Get other user's data
              const { data: otherUser, error } = await fetchWithErrorHandling<UserProfile>(
                () => api.get(`/api/users/${otherUserId}/profile`),
                {
                  defaultErrorMessage: 'Failed to fetch user profile',
                  showErrorToast: false
                }
              );
              
              if (error) throw error;
              
              const userRole = isAmbassador ? 'patient' as const : 'ambassador' as const;
              
              return {
                id: convo.id,
                otherUser: {
                  id: otherUserId,
                  name: otherUser?.full_name || "Unknown User",
                  avatarUrl: otherUser?.avatar_url,
                  role: userRole
                },
                lastMessage: {
                  content: convo.messages?.[0]?.content || "No messages yet",
                  timestamp: convo.last_message_at || convo.created_at,
                  unread: convo.messages?.[0]?.read === false && 
                          convo.messages?.[0]?.recipient_id === user.id
                }
              };
            } catch (error) {
              errorLog("Error fetching user profile:", error);
              const userRole = isAmbassador ? 'patient' as const : 'ambassador' as const;
              
              return {
                id: convo.id,
                otherUser: {
                  id: otherUserId,
                  name: "Unknown User",
                  role: userRole
                },
                lastMessage: {
                  content: convo.messages?.[0]?.content || "No messages yet",
                  timestamp: convo.last_message_at || convo.created_at,
                  unread: false
                }
              };
            }
          })
        );
        
        setConversations(formattedConversations);
        
        // If we have conversations, select the first one
        if (formattedConversations.length > 0) {
          handleSelectConversation(formattedConversations[0].id);
        }
      } catch (error) {
        errorLog("Error loading conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, [user]);
  
  // Handle selecting a conversation
  const handleSelectConversation = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      setActiveConversationId(conversationId);
      
      // Load messages for this conversation
      const messagesData = await messageService.getMessages(conversationId);
      
      // Mark messages as read
      if (user) {
        await messageService.markAsRead(conversationId, user.id);
      }
      
      // Find the conversation to get the other user data
      const convo = conversations.find(c => c.id === conversationId);
      if (convo) {
        setOtherUserData(convo.otherUser);
      }
      
      // Format messages for UI
      const formattedMessages = messagesData.map((msg: ChatMessage) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.created_at,
        isCurrentUser: msg.sender_id === user?.id,
        senderName: msg.sender_id === user?.id ? "You" : convo?.otherUser.name || "User",
        read: msg.read
      }));
      
      setMessages(formattedMessages);
      
      // Update conversation list to show message as read
      setConversations(prev => prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              unread: false
            }
          };
        }
        return c;
      }));
      
      // Clean up previous subscription if exists
      if (subscriptionIdRef.current && user) {
        messageService.unsubscribeFromConversation(
          subscriptionIdRef.current,
          activeConversationId || "",
          user.id
        );
        subscriptionIdRef.current = null;
      }
      
      // Subscribe to new messages for this conversation
      if (user) {
        const handleNewMessage = (data: ChatMessage[]) => {
          if (!data || data.length === 0) return;
          
          // Find messages that aren't already in the state
          const newMessages = data.filter(newMsg => 
            !messages.some(existingMsg => existingMsg.id === newMsg.id)
          );
          
          if (newMessages.length === 0) return;
          
          // Get the most recent message for UI updates
          const latestMessage = newMessages[newMessages.length - 1];
          
          // Mark as read if you are the recipient
          if (latestMessage.recipient_id === user?.id) {
            messageService.markAsRead(conversationId, user.id);
          }
          
          // Add new messages to the UI
          setMessages(prevMessages => [
            ...prevMessages,
            ...newMessages.map(newMsg => ({
              id: newMsg.id,
              content: newMsg.content,
              timestamp: newMsg.created_at,
              isCurrentUser: newMsg.sender_id === user?.id,
              senderName: newMsg.sender_id === user?.id ? "You" : otherUserData?.name || "User",
              read: newMsg.read || newMsg.recipient_id !== user?.id // Messages sent by user are considered read
            }))
          ]);
          
          // Update the conversation list
          setConversations(prevConversations => {
            return prevConversations.map(convo => {
              if (convo.id === conversationId) {
                return {
                  ...convo,
                  lastMessage: {
                    content: latestMessage.content,
                    timestamp: latestMessage.created_at,
                    unread: latestMessage.read === false && 
                            latestMessage.recipient_id === user?.id
                  }
                };
              }
              return convo;
            });
          });
        };
        
        // Subscribe to conversation updates
        subscriptionIdRef.current = messageService.subscribeToConversation(
          conversationId,
          user.id,
          handleNewMessage
        );
        
        devLog('Subscribed to conversation:', conversationId, 'with ID:', subscriptionIdRef.current);
      }
      
    } catch (error) {
      errorLog("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };
  
  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !activeConversationId || !user) return;
    
    try {
      const convo = conversations.find(c => c.id === activeConversationId);
      if (!convo) return;
      
      const sentMessage = await messageService.sendMessage(
        activeConversationId,
        user.id,
        convo.otherUser.id,
        messageText.trim()
      );
      
      // Clear the input
      setMessageText("");
      
      // Since the subscription might have a delay, optimistically add the message to the UI
      if (sentMessage) {
        setMessages(prev => [
          ...prev,
          {
            id: sentMessage.id,
            content: sentMessage.content,
            timestamp: sentMessage.created_at,
            isCurrentUser: true,
            senderName: "You",
            read: true
          }
        ]);
        
        // Update the conversation list
        setConversations(prev => prev.map(c => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              lastMessage: {
                content: sentMessage.content,
                timestamp: sentMessage.created_at,
                unread: false
              }
            };
          }
          return c;
        }));
      }
      
    } catch (error) {
      errorLog("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current && user && activeConversationId) {
        messageService.unsubscribeFromConversation(
          subscriptionIdRef.current,
          activeConversationId,
          user.id
        );
        subscriptionIdRef.current = null;
        devLog('Unsubscribed from conversation on unmount');
      }
    };
  }, [user, activeConversationId]);
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => 
    convo.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex space-x-2">
            <div className="relative w-[250px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100%-5rem)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg">Patients</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mt-2 text-sm text-muted-foreground">Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <h3 className="font-medium">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No results match your search" : "You don't have any active conversations"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-14rem)]">
                  <ConversationList
                    conversations={filteredConversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={handleSelectConversation}
                  />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Chat Window */}
          <Card className="md:col-span-2 flex flex-col">
            {activeConversationId && otherUserData ? (
              <>
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-2">
                      <AvatarImage src={otherUserData.avatarUrl} />
                      <AvatarFallback>{otherUserData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{otherUserData.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">Patient</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden p-0 flex flex-col">
                  {isLoadingMessages ? (
                    <div className="flex-grow flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center p-4 text-center">
                      <div>
                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                        <h3 className="font-medium">No messages yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Start the conversation by sending a message
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-grow pt-4">
                      <div className="flex flex-col space-y-4 px-4">
                        {messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            content={message.content}
                            timestamp={message.timestamp}
                            isCurrentUser={message.isCurrentUser}
                            avatarUrl={undefined}
                            senderName={message.senderName}
                            read={message.read}
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-grow"
                      />
                      <Button type="submit" size="icon" disabled={!messageText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center p-6 text-center">
                <div>
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No conversation selected</h3>
                  <p className="text-muted-foreground mt-1">
                    Select a patient from the list to view your conversation
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 