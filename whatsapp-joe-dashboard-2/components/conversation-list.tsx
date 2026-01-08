"use client";

import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          className={cn(
            "p-4 cursor-pointer transition-colors hover:bg-accent",
            selectedId === conversation.id && "bg-accent",
            conversation.unread && "border-primary"
          )}
          onClick={() => onSelect(conversation.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{conversation.userName}</p>
                {conversation.unread && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {conversation.userId}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {conversation.type === "audio" ? (
                  <Mic className="h-3 w-3 text-blue-500 flex-shrink-0" />
                ) : (
                  <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end ml-4 flex-shrink-0">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {conversation.messageCount} msgs
                </span>
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    conversation.status === "active" ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
