export type ConversationStatus = "active" | "completed";
export type ConversationType = "text" | "audio";

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  status: ConversationStatus;
  unread: boolean;
  messageCount: number;
  type: ConversationType;
}
