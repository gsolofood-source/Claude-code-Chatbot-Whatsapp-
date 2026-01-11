"use client";

import { useState, useEffect } from "react";
import { ConversationList } from "@/components/conversation-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string | number;
  userId: string | number;
  userName: string;
  phone?: string;
  lastMessage: string;
  timestamp: string;
  status: "active" | "ended" | string;
  unread: boolean;
  messageCount: number;
  type: string;
  lastSender?: string;
}

interface Message {
  id?: string;
  content: string;
  role: string;
  timestamp: string;
  sender?: string;
}

interface ConversationDetails {
  userId: string;
  messages: Message[];
  messageCount: number;
  createdAt: string;
  lastActivity: string;
  sessionId?: string;
}

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.conversation) {
        setConversationDetails(data.conversation);
      } else {
        setConversationDetails(null);
      }
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      setConversationDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchConversationDetails(selectedId);
    } else {
      setConversationDetails(null);
    }
  }, [selectedId]);

  const filteredConversations = conversations.filter((conv) =>
    (conv.userName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    String(conv.userId).includes(searchQuery)
  );

  const selectedConversation = conversations.find((c) => String(c.id) === selectedId);
  const messages = conversationDetails?.messages || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
          <p className="text-muted-foreground">
            View and manage all WhatsApp conversations
          </p>
        </div>
        <Button onClick={fetchConversations} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Conversations</CardTitle>
              <CardDescription>
                {filteredConversations.length} total conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-muted-foreground">Loading conversations...</div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center text-muted-foreground">
                        <p>No active conversations</p>
                        <p className="text-xs mt-2">Conversations will appear here when users start chatting</p>
                      </div>
                    </div>
                  ) : (
                    <ConversationList
                      conversations={filteredConversations}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />
                  )}
                </TabsContent>
                <TabsContent value="unread" className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-muted-foreground">Loading conversations...</div>
                    </div>
                  ) : (
                    <ConversationList
                      conversations={filteredConversations.filter((c) => c.unread)}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? selectedConversation.userName : "Select a conversation"}
            </CardTitle>
            <CardDescription>
              {selectedConversation ? selectedConversation.userId : "Choose a conversation from the list to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedConversation && messages ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      selectedConversation.status === "active" ? "bg-green-500" : "bg-gray-400"
                    )} />
                    <span className="text-sm font-medium">
                      {selectedConversation.status === "active" ? "Active" : "Completed"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {selectedConversation.messageCount} messages
                  </span>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-muted-foreground">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-muted-foreground">No messages yet</div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={message.id || index}
                        className={cn(
                          "flex",
                          (message.sender === "user" || message.role === "user") ? "justify-start" : "justify-end"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            (message.sender === "user" || message.role === "user")
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              (message.sender === "user" || message.role === "user")
                                ? "text-muted-foreground"
                                : "text-primary-foreground/70"
                            )}
                          >
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Type a message... (read-only in demo)"
                    disabled
                  />
                  <Button disabled>Send</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
