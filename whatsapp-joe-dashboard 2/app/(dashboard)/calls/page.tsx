"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Clock, User, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CallTranscript {
  callId: string;
  userId: string;
  conversationId: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
  direction: string;
  messagesCount: number;
  hasTranscript: boolean;
}

export default function CallsPage() {
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const response = await fetch("/api/calls/transcripts");
        const data = await response.json();
        setTranscripts(data.transcripts || []);
      } catch (error) {
        console.error("Error fetching call transcripts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscripts();
    const interval = setInterval(fetchTranscripts, 30000); // Refresh ogni 30 secondi

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading calls...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Voice Calls</h2>
        <p className="text-muted-foreground">
          Call history and transcripts from ElevenLabs
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transcripts.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transcripts.length > 0
                ? Math.floor(transcripts.reduce((acc, t) => acc + t.duration, 0) / transcripts.length / 60)
                : 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average call length
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Transcripts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transcripts.filter(t => t.hasTranscript).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available transcripts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <CardDescription>Recent voice calls with transcription status</CardDescription>
        </CardHeader>
        <CardContent>
          {transcripts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No calls yet</p>
              <p className="text-sm mt-2">Voice calls will appear here when they are completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((call) => (
                <div
                  key={call.callId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      call.direction === 'inbound' ? 'bg-blue-500/10' : 'bg-green-500/10'
                    }`}>
                      <Phone className={`h-4 w-4 ${
                        call.direction === 'inbound' ? 'text-blue-500' : 'text-green-500'
                      }`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-medium">{call.userId}</p>
                        <span className="text-xs text-muted-foreground">
                          {call.direction === 'inbound' ? '→ Inbound' : '← Outbound'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(call.duration / 60)}m {call.duration % 60}s
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(call.startTime), { addSuffix: true })}
                        </span>
                        {call.reason && (
                          <span className="px-2 py-0.5 bg-muted rounded">
                            {call.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {call.hasTranscript ? (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">
                          {call.messagesCount} messages
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No transcript
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
