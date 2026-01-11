"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Users, MessageSquare, User, Bot, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatLog {
  id: number | string;
  conversationId: number | string;
  userId: number | string;
  userName: string;
  phone: string;
  role: string;
  type: string;
  content: string;
  timestamp: string;
  processingTimeMs: number | null;
}

interface ChatLogStats {
  totalMessages: number;
  uniqueUsers: number;
  timeRange: number;
  messagesByType?: {
    text: number;
    audio: number;
    image: number;
  };
  messagesBySender?: {
    user: number;
    bot: number;
  };
  users: {
    userId: number | string;
    userName: string;
    phone: string;
    messageCount: number;
    lastMessage: string;
  }[];
}

export default function ChatLogsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [stats, setStats] = useState<ChatLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hours, setHours] = useState("15");
  const [selectedUser, setSelectedUser] = useState<string | "all">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/chat-logs?hours=${hours}`),
        fetch(`/api/chat-logs/stats?hours=${hours}`),
      ]);

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      setLogs(logsData.logs || []);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error("Error fetching chat logs:", error);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = logs.filter((log) => {
    const userIdStr = String(log.userId);
    const matchesSearch =
      (log.content?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      userIdStr.includes(searchQuery) ||
      (log.userName?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesUser = selectedUser === "all" || userIdStr === selectedUser;

    return matchesSearch && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(logs.map(log => String(log.userId))));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chat Logs</h2>
          <p className="text-muted-foreground">
            Visualizza tutti i log delle conversazioni delle ultime {hours} ore
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messaggi Totali</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                Ultime {stats.timeRange} ore
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utenti Unici</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Conversazioni attive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Periodo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.timeRange}h</div>
              <p className="text-xs text-muted-foreground">
                Finestra temporale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Msg/Utente</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.uniqueUsers > 0 ? Math.round(stats.totalMessages / stats.uniqueUsers) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Messaggi per conversazione
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra i log per periodo, utente o contenuto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Select value={hours} onValueChange={setHours}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ultima ora</SelectItem>
                  <SelectItem value="3">Ultime 3 ore</SelectItem>
                  <SelectItem value="6">Ultime 6 ore</SelectItem>
                  <SelectItem value="12">Ultime 12 ore</SelectItem>
                  <SelectItem value="15">Ultime 15 ore</SelectItem>
                  <SelectItem value="24">Ultime 24 ore</SelectItem>
                  <SelectItem value="48">Ultime 48 ore</SelectItem>
                  <SelectItem value="72">Ultime 72 ore</SelectItem>
                  <SelectItem value="168">Ultima settimana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Utente</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli utenti</SelectItem>
                  {uniqueUsers.map((userId) => {
                    const log = logs.find(l => String(l.userId) === userId);
                    const displayName = log?.userName || `Utente ${userId}`;
                    return (
                      <SelectItem key={userId} value={userId}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cerca</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca nel contenuto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Log Messaggi</CardTitle>
              <CardDescription>
                {filteredLogs.length} messaggi trovati
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Caricamento log...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessun log trovato per il periodo selezionato</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border transition-colors hover:bg-muted/50",
                    log.role === "user" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-full",
                        log.role === "user" ? "bg-blue-100" : "bg-green-100"
                      )}>
                        {log.role === "user" ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-green-600" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.role === "user" ? "default" : "secondary"}>
                            {log.role === "user" ? "Utente" : "Bot"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.userName || `Utente ${log.userId}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        <p className="text-sm">{log.content || "(nessun contenuto)"}</p>

                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Tipo: {log.type}</span>
                          {log.phone && <span>• Tel: {log.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("it-IT")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Activity Summary */}
      {stats && stats.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attività Utenti</CardTitle>
            <CardDescription>Riepilogo attività per utente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.users.slice(0, 10).map((user, index) => (
                <div key={String(user.userId)} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ultimo: {formatDistanceToNow(new Date(user.lastMessage), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{user.messageCount} messaggi</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
