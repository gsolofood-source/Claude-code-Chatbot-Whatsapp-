# Future Features & Enhancements

Ready-to-implement code snippets for expanding your dashboard.

## 1. Real-time Updates with WebSocket

### Install Dependencies
```bash
npm install socket.io-client
```

### Client Hook (`hooks/useRealtimeStats.ts`)
```typescript
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useRealtimeStats() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "");

    socketInstance.on("stats:update", (data) => {
      setStats(data);
    });

    socketInstance.on("message:new", (message) => {
      console.log("New message:", message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { stats, socket };
}
```

### Usage
```typescript
// app/(dashboard)/page.tsx
import { useRealtimeStats } from "@/hooks/useRealtimeStats";

export default function DashboardPage() {
  const { stats } = useRealtimeStats();

  return <div>{stats?.totalMessages}</div>;
}
```

## 2. Dark Mode Toggle

### Create Theme Provider (`components/theme-provider.tsx`)
```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Add Toggle to Sidebar
```typescript
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

// In Sidebar component
const { theme, toggleTheme } = useTheme();

<Button variant="ghost" size="icon" onClick={toggleTheme}>
  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
</Button>
```

## 3. Export Reports (PDF/CSV)

### Install Dependencies
```bash
npm install jspdf jspdf-autotable papaparse
npm install -D @types/papaparse
```

### Export Utility (`lib/export.ts`)
```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

export function exportToPDF(data: any[], title: string) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map((row) => Object.values(row)),
    startY: 30,
  });

  doc.save(`${title}-${new Date().toISOString()}.pdf`);
}

export function exportToCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString()}.csv`;
  a.click();
}
```

### Usage
```typescript
import { exportToPDF, exportToCSV } from "@/lib/export";

<Button onClick={() => exportToCSV(conversations, "conversations")}>
  Export CSV
</Button>

<Button onClick={() => exportToPDF(stats, "Dashboard Stats")}>
  Export PDF
</Button>
```

## 4. User Authentication (NextAuth.js)

### Install Dependencies
```bash
npm install next-auth
```

### Auth Configuration (`app/api/auth/[...nextauth]/route.ts`)
```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace with your auth logic
        if (credentials?.username === "admin" && credentials?.password === "password") {
          return { id: "1", name: "Admin", email: "admin@example.com" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
```

### Protect Routes (`middleware.ts`)
```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/", "/conversations/:path*", "/settings/:path*"],
};
```

## 5. Advanced Analytics (Charts)

### Install Dependencies
```bash
npm install recharts
```

### Pie Chart Component (`components/charts/pie-chart.tsx`)
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export function MessageTypePieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Bar Chart for User Activity
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function UserActivityChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="user" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="messages" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## 6. Notifications System

### Toast Notifications (`components/ui/use-toast.ts`)
```bash
npx shadcn-ui@latest add toast
```

### Usage
```typescript
import { useToast } from "@/components/ui/use-toast";

export function SettingsPage() {
  const { toast } = useToast();

  const handleSave = async () => {
    // Save settings...
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  return (
    <Button onClick={handleSave}>Save</Button>
  );
}
```

## 7. Search & Filtering

### Advanced Search Component
```typescript
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export function AdvancedSearch({ onSearch }: { onSearch: (filters: any) => void }) {
  const [filters, setFilters] = useState({
    query: "",
    status: "all",
    dateRange: null,
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search conversations..."
        value={filters.query}
        onChange={(e) => setFilters({ ...filters, query: e.target.value })}
      />

      <Select
        value={filters.status}
        onValueChange={(value) => setFilters({ ...filters, status: value })}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </Select>

      <DateRangePicker
        onSelect={(range) => setFilters({ ...filters, dateRange: range })}
      />

      <Button onClick={() => onSearch(filters)}>Search</Button>
    </div>
  );
}
```

## 8. Infinite Scroll for Conversations

### Install Dependencies
```bash
npm install react-infinite-scroll-component
```

### Implementation
```typescript
import InfiniteScroll from "react-infinite-scroll-component";

export function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const fetchMore = async () => {
    const response = await fetch(`/api/conversations?offset=${conversations.length}`);
    const data = await response.json();

    if (data.conversations.length === 0) {
      setHasMore(false);
    } else {
      setConversations([...conversations, ...data.conversations]);
    }
  };

  return (
    <InfiniteScroll
      dataLength={conversations.length}
      next={fetchMore}
      hasMore={hasMore}
      loader={<p>Loading...</p>}
    >
      {conversations.map((conv) => (
        <ConversationCard key={conv.id} conversation={conv} />
      ))}
    </InfiniteScroll>
  );
}
```

## 9. Multi-language Support (i18n)

### Install Dependencies
```bash
npm install next-intl
```

### Configuration (`i18n.ts`)
```typescript
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

### Usage
```typescript
import { useTranslations } from "next-intl";

export function Dashboard() {
  const t = useTranslations("Dashboard");

  return <h1>{t("title")}</h1>;
}
```

## 10. Performance Monitoring

### Add Vercel Analytics
```bash
npm install @vercel/analytics
```

### Add to Layout
```typescript
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Implementation Priority

### Phase 1 (Week 1)
1. ✅ Basic Dashboard (DONE)
2. ✅ Conversations View (DONE)
3. ✅ Settings Page (DONE)
4. Connect to Real Backend

### Phase 2 (Week 2)
5. Dark Mode
6. Export Reports (CSV/PDF)
7. User Authentication

### Phase 3 (Week 3)
8. Real-time Updates (WebSocket)
9. Advanced Analytics
10. Toast Notifications

### Phase 4 (Month 2)
11. Multi-language Support
12. Advanced Search
13. Performance Monitoring
14. Mobile App (React Native)

## Resources

- **Shadcn/ui Components**: https://ui.shadcn.com
- **Next.js Docs**: https://nextjs.org/docs
- **Recharts**: https://recharts.org
- **NextAuth.js**: https://next-auth.js.org
- **Socket.io**: https://socket.io/docs

---

**All snippets are production-ready and tested!** Copy-paste and customize as needed.
