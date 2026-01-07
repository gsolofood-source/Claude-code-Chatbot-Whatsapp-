"use client";

import { useState } from "react";
import { ConversationList } from "@/components/conversation-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { mockConversations, mockConversationMessages } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = mockConversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.userId.includes(searchQuery)
  );

  const selectedConversation = mockConversations.find((c) => c.id === selectedId);
  const messages = selectedId ? mockConversationMessages[selectedId as keyof typeof mockConversationMessages] : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
        <p className="text-muted-foreground">
          View and manage all WhatsApp conversations
        </p>
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
                  <ConversationList
                    conversations={filteredConversations}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </TabsContent>
                <TabsContent value="unread" className="mt-4">
                  <ConversationList
                    conversations={filteredConversations.filter((c) => c.unread)}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === "user" ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          message.sender === "user"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.sender === "user"
                              ? "text-muted-foreground"
                              : "text-primary-foreground/70"
                          )}
                        >
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
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
