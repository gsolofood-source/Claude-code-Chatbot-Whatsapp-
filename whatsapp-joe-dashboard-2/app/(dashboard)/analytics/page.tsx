"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, TrendingUp, Clock, MessageSquare, Phone,
  RefreshCw, UserCheck, Activity, Target, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudienceData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  avgMessagesPerUser: number;
  returnRate: number;
  callingUsers: number;
  activityBreakdown: {
    superActive: number;
    active: number;
    moderate: number;
    casual: number;
  };
  registrationTrend: { date: string; count: number }[];
}

interface Segment {
  name: string;
  description: string;
  userCount: number;
  percentage: number;
  avgMessages: number;
  topInterests: string[];
}

interface PeakHour {
  hour: number;
  messageCount: number;
  percentage: number;
}

interface TopUser {
  userId: number | string;
  userName: string;
  phone: string;
  messageCount: number;
  lastActive: string;
  avgMessagesPerDay: number;
}

interface Topic {
  pattern: string;
  count: number;
  percentage: number;
}

export default function AnalyticsPage() {
  const [audience, setAudience] = useState<AudienceData | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [audienceRes, segmentsRes, peakHoursRes, topUsersRes, topicsRes] = await Promise.all([
        fetch("/api/analytics/audience"),
        fetch("/api/analytics/segments"),
        fetch(`/api/analytics/peak-hours?days=${days}`),
        fetch("/api/analytics/top-users"),
        fetch(`/api/analytics/topics?days=${days}`),
      ]);

      const [audienceData, segmentsData, peakHoursData, topUsersData, topicsData] = await Promise.all([
        audienceRes.json(),
        segmentsRes.json(),
        peakHoursRes.json(),
        topUsersRes.json(),
        topicsRes.json(),
      ]);

      setAudience(audienceData.audience || null);
      setSegments(segmentsData.segments || []);
      setPeakHours(peakHoursData.peakHours || []);
      setTopUsers(topUsersData.topUsers || []);
      setTopics(topicsData.topics || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Caricamento analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Insights avanzati sul comportamento degli utenti
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Ultimi 7 giorni</SelectItem>
              <SelectItem value="14">Ultimi 14 giorni</SelectItem>
              <SelectItem value="30">Ultimi 30 giorni</SelectItem>
              <SelectItem value="90">Ultimi 90 giorni</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Audience Overview */}
      {audience && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audience.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {audience.newUsers} nuovi questa settimana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audience.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {audience.totalUsers > 0 ? Math.round((audience.activeUsers / audience.totalUsers) * 100) : 0}% del totale
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Media Msg/Utente</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audience.avgMessagesPerUser}</div>
                <p className="text-xs text-muted-foreground">
                  Messaggi per utente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utenti Vocali</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{audience.callingUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Hanno usato chiamate vocali
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Livelli di Attività
              </CardTitle>
              <CardDescription>Distribuzione utenti per frequenza di utilizzo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{audience.activityBreakdown.superActive}</div>
                  <div className="text-sm font-medium">Super Attivi</div>
                  <div className="text-xs text-muted-foreground">50+ messaggi</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{audience.activityBreakdown.active}</div>
                  <div className="text-sm font-medium">Attivi</div>
                  <div className="text-xs text-muted-foreground">20-49 messaggi</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{audience.activityBreakdown.moderate}</div>
                  <div className="text-sm font-medium">Moderati</div>
                  <div className="text-xs text-muted-foreground">5-19 messaggi</div>
                </div>
                <div className="text-center p-4 bg-gray-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">{audience.activityBreakdown.casual}</div>
                  <div className="text-sm font-medium">Occasionali</div>
                  <div className="text-xs text-muted-foreground">1-4 messaggi</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Segments */}
      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Segmenti Utenti
            </CardTitle>
            <CardDescription>Classificazione automatica basata su interessi e comportamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {segments.map((segment, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{segment.name}</h4>
                    <Badge variant="secondary">{segment.userCount} utenti</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{segment.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.topInterests.slice(0, 3).map((interest, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Media: {segment.avgMessages} msg/utente
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Peak Hours */}
        {peakHours.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ore di Punta
              </CardTitle>
              <CardDescription>Quando gli utenti sono più attivi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {peakHours.slice(0, 8).map((hour, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 text-sm font-medium">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          index === 0 ? "bg-green-500" :
                          index < 3 ? "bg-blue-500" : "bg-gray-400"
                        )}
                        style={{ width: `${hour.percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-right text-muted-foreground">
                      {hour.messageCount} msg
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topics */}
        {topics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Argomenti Popolari
              </CardTitle>
              <CardDescription>Di cosa parlano gli utenti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topics.slice(0, 8).map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        index === 0 ? "bg-green-500" :
                        index < 3 ? "bg-blue-500" : "bg-gray-400"
                      )} />
                      <span className="text-sm">{topic.pattern}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{topic.count}</span>
                      <Badge variant="outline" className="text-xs">
                        {topic.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Users */}
      {topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Utenti
            </CardTitle>
            <CardDescription>Gli utenti più attivi sulla piattaforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.slice(0, 10).map((user, index) => (
                <div
                  key={String(user.userId)}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                      index === 0 ? "bg-yellow-500 text-yellow-950" :
                      index === 1 ? "bg-gray-300 text-gray-700" :
                      index === 2 ? "bg-amber-600 text-amber-50" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.userName}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{user.messageCount} msg</p>
                    <p className="text-xs text-muted-foreground">
                      ~{user.avgMessagesPerDay} msg/giorno
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
