import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckIcon, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  content?: string;
  message?: string; // Legacy naming
  timestamp?: string;
  time?: string; // Legacy naming
  isCurrentUser: boolean;
  avatarUrl?: string;
  senderName: string;
  read?: boolean;
  isRead?: boolean; // Legacy naming
}

export const MessageBubble = ({
  content,
  message,
  timestamp,
  time,
  isCurrentUser,
  avatarUrl,
  senderName,
  read,
  isRead
}: MessageBubbleProps) => {
  // Support both naming conventions
  const messageContent = content || message || "";
  const messageTime = timestamp || time || new Date().toISOString();
  const messageRead = read ?? isRead ?? false;
  
  const initials = senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex w-full gap-2 mb-4",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={avatarUrl} alt={senderName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      
      <div className="max-w-[75%]">
        <div
          className={cn(
            "rounded-lg p-3",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted text-foreground rounded-tl-none"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{messageContent}</p>
        </div>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs",
          isCurrentUser ? "justify-end" : "justify-start",
          "text-muted-foreground"
        )}>
          {format(new Date(messageTime), "h:mm a")}
          {isCurrentUser && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {messageRead ? (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  ) : (
                    <CheckIcon className="h-3 w-3" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {messageRead ? "Read" : "Delivered"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={avatarUrl} alt={senderName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}; 