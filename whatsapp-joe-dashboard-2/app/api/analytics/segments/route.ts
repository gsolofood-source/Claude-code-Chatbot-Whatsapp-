import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

// Segment definitions based on keywords and behavior
const SEGMENT_KEYWORDS: Record<string, { keywords: string[]; emoji: string; description: string }> = {
  'aspiranti_ristoratori': {
    keywords: ['aprire', 'avviare', 'nuovo ristorante', 'primo ristorante', 'sogno', 'iniziare'],
    emoji: '🍽️',
    description: 'Utenti interessati ad aprire un ristorante',
  },
  'ristoratori_attivi': {
    keywords: ['mio ristorante', 'mio locale', 'gestisco', 'i miei clienti', 'il mio staff'],
    emoji: '👨‍🍳',
    description: 'Proprietari di ristoranti attivi',
  },
  'appassionati_vino': {
    keywords: ['vino', 'vini', 'cantina', 'sommelier', 'degustazione', 'annata'],
    emoji: '🍷',
    description: 'Appassionati di vino e enologia',
  },
  'food_lovers': {
    keywords: ['ricetta', 'cucinare', 'ingredienti', 'piatto', 'cuoco', 'chef'],
    emoji: '🍕',
    description: 'Appassionati di cucina e cibo',
  },
  'potenziali_investitori': {
    keywords: ['investire', 'investimento', 'capitale', 'soci', 'business plan', 'roi'],
    emoji: '💰',
    description: 'Interessati a investimenti nel settore food',
  },
  'cercatori_carriera': {
    keywords: ['lavorare', 'lavoro', 'carriera', 'assunzione', 'cv', 'esperienza'],
    emoji: '💼',
    description: 'Cercano opportunità lavorative nel settore',
  },
  'organizzatori_eventi': {
    keywords: ['evento', 'matrimonio', 'festa', 'catering', 'cena privata', 'compleanno'],
    emoji: '🎉',
    description: 'Organizzano eventi e cercano catering',
  },
  'fan_followers': {
    keywords: ['fan', 'ammiro', 'masterchef', 'programma', 'libro', 'autografo'],
    emoji: '⭐',
    description: 'Fan di Joe Bastianich',
  },
};

function detectSegments(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const segments: string[] = [];
  
  for (const [segment, config] of Object.entries(SEGMENT_KEYWORDS)) {
    if (config.keywords.some(kw => lowerContent.includes(kw))) {
      segments.push(segment);
    }
  }
  
  return segments;
}

export async function GET() {
  try {
    // Get all user messages
    const messages = await query<{
      user_id: string;
      content: string;
    }>(`
      SELECT user_id, content
      FROM messages
      WHERE role = 'user'
        AND message_type = 'text'
    `);

    // Analyze segments per user
    const userSegments: Record<string, Set<string>> = {};
    const segmentCounts: Record<string, number> = {};
    
    for (const msg of messages) {
      const segments = detectSegments(msg.content);
      
      if (!userSegments[msg.user_id]) {
        userSegments[msg.user_id] = new Set();
      }
      
      for (const segment of segments) {
        userSegments[msg.user_id].add(segment);
      }
    }

    // Count users per segment
    for (const segments of Object.values(userSegments)) {
      for (const segment of segments) {
        segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
      }
    }

    // Total users
    const totalUsersResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );
    const totalUsers = parseInt(totalUsersResult?.count || "0");

    // Format segments with metadata
    const formattedSegments = Object.entries(SEGMENT_KEYWORDS).map(([key, config]) => ({
      id: key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      emoji: config.emoji,
      description: config.description,
      userCount: segmentCounts[key] || 0,
      percentage: totalUsers > 0 
        ? Math.round(((segmentCounts[key] || 0) / totalUsers) * 100) 
        : 0,
    })).sort((a, b) => b.userCount - a.userCount);

    // Top users per segment (get top 5 per segment)
    // Using IN clause with dynamic values instead of ANY with array
    const topUsersPerSegment: Record<string, { userId: string; name: string; messageCount: number }[]> = {};
    
    for (const segment of Object.keys(SEGMENT_KEYWORDS)) {
      const usersInSegment = Object.entries(userSegments)
        .filter(([_, segments]) => segments.has(segment))
        .map(([userId]) => userId);
      
      if (usersInSegment.length > 0) {
        // Build parameterized query with numbered placeholders
        const placeholders = usersInSegment.map((_, i) => `$${i + 1}`).join(', ');
        const topUsers = await query<{ user_id: string; name: string; msg_count: string }>(`
          SELECT 
            u.id as user_id,
            COALESCE(u.name, 'Utente Anonimo') as name,
            u.total_messages as msg_count
          FROM users u
          WHERE u.id IN (${placeholders})
          ORDER BY u.total_messages DESC
          LIMIT 5
        `, usersInSegment.map(id => parseInt(id)));
        
        topUsersPerSegment[segment] = topUsers.map(u => ({
          userId: u.user_id,
          name: u.name,
          messageCount: parseInt(u.msg_count),
        }));
      }
    }

    // Calculate lead scores based on segments
    const segmentBonuses: Record<string, number> = {
      'potenziali_investitori': 25,
      'ristoratori_attivi': 20,
      'aspiranti_ristoratori': 15,
      'organizzatori_eventi': 10,
      'appassionati_vino': 5,
    };

    // High value leads (users in multiple valuable segments)
    const highValueLeads: { userId: string; segments: string[]; score: number }[] = [];
    
    for (const [userId, segments] of Object.entries(userSegments)) {
      let score = 0;
      for (const segment of segments) {
        score += segmentBonuses[segment] || 0;
      }
      if (score >= 15) {
        highValueLeads.push({
          userId,
          segments: Array.from(segments),
          score,
        });
      }
    }
    
    highValueLeads.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      segments: {
        breakdown: formattedSegments,
        topUsersPerSegment,
        highValueLeads: highValueLeads.slice(0, 20),
        insights: {
          totalSegmentedUsers: Object.keys(userSegments).length,
          mostPopularSegment: formattedSegments[0]?.name || 'N/A',
          recommendation: formattedSegments[0] 
            ? `Il segmento "${formattedSegments[0].name}" è il più grande con ${formattedSegments[0].userCount} utenti. Considera di creare contenuti mirati per loro.`
            : 'Raccogli più dati per segmentare il tuo pubblico.',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
