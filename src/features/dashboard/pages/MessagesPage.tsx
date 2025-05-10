import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { ConversationList, ConversationItem, ConversationUser } from "@/components/messaging/ConversationList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { messageService, ChatMessage } from "@/services/messageService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, Send, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { fetchWithErrorHandling } from "@/utils/error-handling";
import { errorLog, devLog } from "@/utils/environment";

// Import the dashboard layout component
import DashboardLayout from "../components/DashboardLayout";

// Define the UserProfile interface
interface UserProfile {
  full_name: string;
  avatar_url?: string;
  id: string;
  email?: string;
  role?: string;
}

// The main difference from the ambassador version is focused on connecting with ambassadors
// rather than patients, and some UI elements are tailored for patients

export default function MessagesPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{
    id: string;
    content: string;
    timestamp: string;
    isCurrentUser: boolean;
    senderName: string;
    read: boolean;
  }[]>([]);
  const [messageText, setMessageText] = useState("");
  const [otherUserData, setOtherUserData] = useState<ConversationUser | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
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
            const isPatient = convo.patient_id === user.id;
            const otherUserId = isPatient ? convo.ambassador_id : convo.patient_id;
            
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
              
              const userRole = isPatient ? 'ambassador' as const : 'patient' as const;
              
              return {
                id: convo.id,
                otherUser: {
                  id: otherUserId,
                  name: otherUser?.full_name || "Unknown Ambassador",
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
              const userRole = isPatient ? 'ambassador' as const : 'patient' as const;
              
              return {
                id: convo.id,
                otherUser: {
                  id: otherUserId,
                  name: "Unknown Ambassador",
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
        senderName: msg.sender_id === user?.id ? "You" : convo?.otherUser.name || "Ambassador",
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
              senderName: newMsg.sender_id === user?.id ? "You" : otherUserData?.name || "Ambassador",
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

  // Content to render inside the dashboard layout
  const messagesContent = (
    <div className="p-4 md:p-6 h-[calc(100vh-134px)]">
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        
        {conversations.length === 0 && !isLoading && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No conversations yet</AlertTitle>
            <AlertDescription>
              Connect with ambassadors through your dashboard to start conversations.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-190px)]">
            {/* Conversations List */}
            <Card className="md:col-span-1 h-full">
              <CardHeader className="p-3 pb-0">
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-3">
                <ConversationList
                  conversations={filteredConversations}
                  activeConversationId={activeConversationId || undefined}
                  onSelectConversation={handleSelectConversation}
                  isLoading={false}
                />
              </CardContent>
            </Card>
            
            {/* Messages Area */}
            <Card className="md:col-span-2 h-full flex flex-col">
              {activeConversationId ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
                    {otherUserData && (
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={otherUserData.avatarUrl} alt={otherUserData.name} />
                          <AvatarFallback>
                            {otherUserData.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-md">{otherUserData.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">
                            {otherUserData.role}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/ambassadors/${otherUserData?.id}`, '_blank')}
                    >
                      View Profile
                    </Button>
                  </CardHeader>
                  
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground mb-2">No messages yet</p>
                        <p className="text-sm text-muted-foreground">
                          Send a message to start the conversation
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            content={message.content}
                            timestamp={message.timestamp}
                            isCurrentUser={message.isCurrentUser}
                            avatarUrl={(message.isCurrentUser && user?.avatar_url) || otherUserData?.avatarUrl}
                            senderName={message.senderName}
                            read={message.read}
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!messageText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="mb-4 p-4 bg-primary/10 rounded-full">
                    <MessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-1">Your Messages</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Select a conversation to start messaging or browse ambassadors to start new conversations.
                  </p>
                  <Button 
                    className="gap-2" 
                    onClick={() => window.location.href = "/ambassadors"}
                  >
                    Find Ambassadors
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  return <DashboardLayout>{messagesContent}</DashboardLayout>;
} 