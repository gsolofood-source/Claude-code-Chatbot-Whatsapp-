"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, DollarSign, Phone } from "lucide-react";

interface Stats {
  totalMessages: number;
  activeUsers: number;
  avgResponseTime: string;
  apiCosts: string;
  trends: {
    messages: { value: number; isPositive: boolean };
    users: { value: number; isPositive: boolean };
    responseTime: { value: number; isPositive: boolean };
    costs: { value: number; isPositive: boolean };
  };
}

interface Call {
  call_id: string;
  user: string;
  duration: number;
  status: string;
  reason: string;
}

interface CallsData {
  active_calls: number;
  calls: Call[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<CallsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, callsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/calls"),
        ]);

        const statsData = await statsRes.json();
        const callsData = await callsRes.json();

        setStats(statsData.stats);
        setCalls(callsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor your WhatsApp Joe Bot performance and activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Messages"
          value={stats.totalMessages}
          description="Messages processed"
          icon={MessageSquare}
          trend={stats.trends.messages}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          description="Unique conversations"
          icon={Users}
          trend={stats.trends.users}
        />
        <StatCard
          title="Active Calls"
          value={calls?.active_calls || 0}
          description="Voice calls in progress"
          icon={Phone}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard
          title="Avg Response Time"
          value={stats.avgResponseTime}
          description="Average bot response"
          icon={Clock}
          trend={stats.trends.responseTime}
        />
        <StatCard
          title="API Costs"
          value={stats.apiCosts}
          description="OpenAI + ElevenLabs"
          icon={DollarSign}
          trend={stats.trends.costs}
        />
      </div>

      {calls && calls.active_calls > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Voice Calls</CardTitle>
            <CardDescription>Currently in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calls.calls.map((call) => (
                <div key={call.call_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-green-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">{call.user}</p>
                      <p className="text-xs text-muted-foreground">
                        {call.reason} • {Math.floor(call.duration / 60)}m {call.duration % 60}s
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-green-600">
                    {call.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Service status and connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">WhatsApp API</span>
              </div>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">OpenAI API</span>
              </div>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">ElevenLabs API</span>
              </div>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Bot Server</span>
              </div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Stats</CardTitle>
            <CardDescription>Message type breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Audio Messages</span>
              <span className="font-semibold">{stats.totalMessages > 0 ? "Active" : "0"}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "60%" }} />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Text Messages</span>
              <span className="font-semibold">{stats.totalMessages > 0 ? "Active" : "0"}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: "30%" }} />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Voice Calls</span>
              <span className="font-semibold">{calls?.active_calls || 0}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: "10%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
