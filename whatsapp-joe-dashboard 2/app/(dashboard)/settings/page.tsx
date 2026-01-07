"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockSettings } from "@/lib/mock-data";
import { Save, RefreshCw, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState(mockSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Would call API route here
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your WhatsApp Joe Bot behavior and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Status</CardTitle>
              <CardDescription>
                Control whether the bot is active and responding to messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bot-enabled">Bot Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn the bot on or off completely
                  </p>
                </div>
                <Switch
                  id="bot-enabled"
                  checked={settings.botEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, botEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audio-enabled">Audio Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable voice responses via ElevenLabs
                  </p>
                </div>
                <Switch
                  id="audio-enabled"
                  checked={settings.audioEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, audioEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set when the bot should be active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="business-hours">Enable Business Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict bot activity to specific hours
                  </p>
                </div>
                <Switch
                  id="business-hours"
                  checked={settings.businessHours.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      businessHours: { ...settings.businessHours, enabled: checked },
                    })
                  }
                />
              </div>

              {settings.businessHours.enabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={settings.businessHours.start}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          businessHours: {
                            ...settings.businessHours,
                            start: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={settings.businessHours.end}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          businessHours: {
                            ...settings.businessHours,
                            end: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Joe's Personality Settings</CardTitle>
              <CardDescription>
                Customize how Joe responds to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tone">Conversation Tone</Label>
                <select
                  id="tone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={settings.personality.tone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      personality: { ...settings.personality, tone: e.target.value },
                    })
                  }
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="tough">Tough (Classic Joe)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  How Joe should approach conversations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verbosity">Response Length</Label>
                <select
                  id="verbosity"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={settings.personality.verbosity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      personality: { ...settings.personality, verbosity: e.target.value },
                    })
                  }
                >
                  <option value="brief">Brief</option>
                  <option value="medium">Medium</option>
                  <option value="detailed">Detailed</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  How verbose Joe's responses should be
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Replies</CardTitle>
              <CardDescription>
                Configure automated responses for different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-reply">Enable Auto-Reply</Label>
                  <p className="text-sm text-muted-foreground">
                    Send automatic welcome and away messages
                  </p>
                </div>
                <Switch
                  id="auto-reply"
                  checked={settings.autoReply.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      autoReply: { ...settings.autoReply, enabled: checked },
                    })
                  }
                />
              </div>

              {settings.autoReply.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Input
                      id="welcome-message"
                      value={settings.autoReply.welcomeMessage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoReply: {
                            ...settings.autoReply,
                            welcomeMessage: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      First message sent to new users
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="away-message">Away Message</Label>
                    <Input
                      id="away-message"
                      value={settings.autoReply.awayMessage}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoReply: {
                            ...settings.autoReply,
                            awayMessage: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Message sent outside business hours
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important events
                  </p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={settings.notifications.emailAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailAlerts: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="error-alerts">Error Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when errors occur
                  </p>
                </div>
                <Switch
                  id="error-alerts"
                  checked={settings.notifications.errorAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, errorAlerts: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-summary">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive daily activity summaries
                  </p>
                </div>
                <Switch
                  id="daily-summary"
                  checked={settings.notifications.dailySummary}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, dailySummary: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="destructive" className="w-full">
                Reset All Settings
              </Button>
              <Button variant="outline" className="w-full border-destructive text-destructive">
                Clear All Conversation History
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
