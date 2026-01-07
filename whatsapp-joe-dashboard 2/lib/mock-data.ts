// Mock data for dashboard

export const mockStats = {
  totalMessages: 1247,
  activeUsers: 89,
  avgResponseTime: "4.2s",
  apiCosts: "$12.45",
  trends: {
    messages: { value: 12.5, isPositive: true },
    users: { value: 8.2, isPositive: true },
    responseTime: { value: -5.1, isPositive: true },
    costs: { value: 15.3, isPositive: false },
  },
};

export const mockTimelineData = [
  { time: "00:00", messages: 12 },
  { time: "02:00", messages: 8 },
  { time: "04:00", messages: 5 },
  { time: "06:00", messages: 15 },
  { time: "08:00", messages: 28 },
  { time: "10:00", messages: 42 },
  { time: "12:00", messages: 38 },
  { time: "14:00", messages: 45 },
  { time: "16:00", messages: 52 },
  { time: "18:00", messages: 48 },
  { time: "20:00", messages: 35 },
  { time: "22:00", messages: 22 },
];

export const mockConversations = [
  {
    id: "1",
    userId: "+39 393******154",
    userName: "Marco R.",
    lastMessage: "Ciao Joe, quali sono i tuoi piatti preferiti?",
    timestamp: "2026-01-07T10:30:00Z",
    status: "active",
    unread: true,
    messageCount: 8,
    type: "text",
  },
  {
    id: "2",
    userId: "+39 393******287",
    userName: "Laura B.",
    lastMessage: "🎤 Voice message",
    timestamp: "2026-01-07T09:15:00Z",
    status: "active",
    unread: false,
    messageCount: 15,
    type: "audio",
  },
  {
    id: "3",
    userId: "+39 320******421",
    userName: "Giuseppe M.",
    lastMessage: "Grazie per i consigli sulla pasta!",
    timestamp: "2026-01-07T08:45:00Z",
    status: "completed",
    unread: false,
    messageCount: 5,
    type: "text",
  },
  {
    id: "4",
    userId: "+39 348******892",
    userName: "Francesca P.",
    lastMessage: "🎤 Voice message",
    timestamp: "2026-01-07T07:20:00Z",
    status: "active",
    unread: true,
    messageCount: 12,
    type: "audio",
  },
  {
    id: "5",
    userId: "+39 333******156",
    userName: "Antonio L.",
    lastMessage: "Qual è il miglior vino da abbinare?",
    timestamp: "2026-01-06T22:30:00Z",
    status: "completed",
    unread: false,
    messageCount: 6,
    type: "text",
  },
];

export const mockConversationMessages = {
  "1": [
    {
      id: "msg1",
      sender: "user",
      content: "Ciao Joe!",
      timestamp: "2026-01-07T10:25:00Z",
      type: "text",
    },
    {
      id: "msg2",
      sender: "bot",
      content: "Ciao! Come posso aiutarti oggi con la cucina?",
      timestamp: "2026-01-07T10:25:05Z",
      type: "text",
    },
    {
      id: "msg3",
      sender: "user",
      content: "Quali sono i tuoi piatti preferiti?",
      timestamp: "2026-01-07T10:30:00Z",
      type: "text",
    },
    {
      id: "msg4",
      sender: "bot",
      content: "Amo i piatti semplici ma fatti con ingredienti di qualità. La pasta alla carbonara autentica, il risotto ai funghi porcini, e ovviamente una buona bistecca fiorentina. La semplicità è la chiave!",
      timestamp: "2026-01-07T10:30:04Z",
      type: "text",
    },
  ],
};

export const mockRecentActivity = [
  {
    id: "1",
    type: "message",
    description: "New message from Marco R.",
    timestamp: "2026-01-07T10:30:00Z",
  },
  {
    id: "2",
    type: "audio",
    description: "Voice message from Laura B.",
    timestamp: "2026-01-07T09:15:00Z",
  },
  {
    id: "3",
    type: "error",
    description: "OpenAI API timeout (recovered)",
    timestamp: "2026-01-07T08:52:00Z",
  },
  {
    id: "4",
    type: "message",
    description: "New message from Giuseppe M.",
    timestamp: "2026-01-07T08:45:00Z",
  },
  {
    id: "5",
    type: "audio",
    description: "Voice message from Francesca P.",
    timestamp: "2026-01-07T07:20:00Z",
  },
];

export const mockSettings = {
  botEnabled: true,
  audioEnabled: true,
  businessHours: {
    enabled: true,
    start: "08:00",
    end: "22:00",
    timezone: "Europe/Rome",
  },
  autoReply: {
    enabled: true,
    welcomeMessage: "Ciao! Sono Joe Bastianich. Come posso aiutarti oggi con la cucina?",
    awayMessage: "Al momento sono impegnato. Ti risponderò appena possibile!",
  },
  personality: {
    tone: "friendly",
    verbosity: "medium",
    italianLevel: "native",
  },
  notifications: {
    emailAlerts: true,
    errorAlerts: true,
    dailySummary: true,
  },
};
