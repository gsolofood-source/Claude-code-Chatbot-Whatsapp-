import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Segment definitions based on conversation content
const SEGMENT_DEFINITIONS = {
  aspiring_restaurateur: {
    name: 'Aspiranti Ristoratori',
    description: 'Utenti che vogliono aprire un ristorante',
    keywords: ['aprire', 'ristorante', 'avviare', 'attività', 'locale', 'investire', 'business plan'],
    icon: '🍽️',
  },
  existing_owner: {
    name: 'Ristoratori Attivi',
    description: 'Proprietari di ristoranti esistenti',
    keywords: ['mio ristorante', 'mio locale', 'gestisco', 'ho un', 'il mio', 'staff', 'dipendenti'],
    icon: '👨‍🍳',
  },
  wine_enthusiast: {
    name: 'Appassionati di Vino',
    description: 'Interessati al mondo del vino',
    keywords: ['vino', 'vini', 'cantina', 'sommelier', 'degustazione', 'barolo', 'champagne'],
    icon: '🍷',
  },
  food_lover: {
    name: 'Food Lovers',
    description: 'Appassionati di cucina e cibo',
    keywords: ['ricetta', 'cucinare', 'piatto', 'ingredienti', 'chef', 'cucina', 'gastronomia'],
    icon: '🍕',
  },
  investor: {
    name: 'Potenziali Investitori',
    description: 'Interessati a investimenti nel food',
    keywords: ['investimento', 'capitale', 'ritorno', 'franchising', 'partnership', 'quote'],
    icon: '💰',
  },
  career_seeker: {
    name: 'Cercatori di Carriera',
    description: 'Interessati a lavorare nella ristorazione',
    keywords: ['lavorare', 'lavoro', 'carriera', 'stage', 'esperienza', 'curriculum', 'assunzione'],
    icon: '💼',
  },
  event_planner: {
    name: 'Organizzatori Eventi',
    description: 'Interessati a catering e eventi',
    keywords: ['evento', 'catering', 'matrimonio', 'festa', 'cena privata', 'location'],
    icon: '🎉',
  },
  fan: {
    name: 'Fan & Followers',
    description: 'Fan generici interessati al personaggio',
    keywords: ['masterchef', 'tv', 'libro', 'programma', 'ammiro', 'seguo', 'fan'],
    icon: '⭐',
  },
};

function detectSegments(messages: string[]): string[] {
  const combinedText = messages.join(' ').toLowerCase();
  const detectedSegments: string[] = [];

  for (const [segmentId, segment] of Object.entries(SEGMENT_DEFINITIONS)) {
    const matchCount = segment.keywords.filter(kw => combinedText.includes(kw)).length;
    if (matchCount >= 2) { // At least 2 keyword matches
      detectedSegments.push(segmentId);
    }
  }

  return detectedSegments.length > 0 ? detectedSegments : ['fan'];
}

export async function GET() {
  try {
    // Get all users with their messages
    const userMessages = await query<{
      user_id: string;
      name: string;
      phone_number: string;
      messages: string;
      message_count: string;
      call_count: string;
      last_interaction: string;
    }>(`
      SELECT 
        u.id as user_id,
        COALESCE(u.name, 'Utente Anonimo') as name,
        u.phone_number,
        STRING_AGG(m.content, ' ') as messages,
        COUNT(m.id) as message_count,
        COALESCE(ct.call_count, 0) as call_count,
        MAX(m.created_at) as last_interaction
      FROM users u
      LEFT JOIN conversations c ON c.user_id = u.id
      LEFT JOIN messages m ON m.conversation_id = c.id AND m.sender = 'user' AND m.message_type = 'text'
      LEFT JOIN (
        SELECT user_id, COUNT(*) as call_count
        FROM call_transcripts
        GROUP BY user_id
      ) ct ON ct.user_id = u.id
      GROUP BY u.id, u.name, u.phone_number, ct.call_count
      HAVING COUNT(m.id) >= 3
    `);

    // Segment users
    const segmentCounts: Record<string, number> = {};
    const segmentUsers: Record<string, Array<{
      userId: string;
      name: string;
      phone: string;
      messageCount: number;
      callCount: number;
      lastInteraction: string;
      leadScore: number;
    }>> = {};

    for (const user of userMessages) {
      const userMsgs = user.messages ? [user.messages] : [];
      const segments = detectSegments(userMsgs);
      
      const messageCount = parseInt(user.message_count);
      const callCount = parseInt(user.call_count);
      
      // Calculate lead score (0-100)
      // Higher score = more valuable lead for partnerships
      let leadScore = 0;
      leadScore += Math.min(messageCount * 2, 30); // Max 30 points for messages
      leadScore += Math.min(callCount * 10, 20); // Max 20 points for calls
      
      // Bonus for high-value segments
      if (segments.includes('investor')) leadScore += 25;
      if (segments.includes('existing_owner')) leadScore += 20;
      if (segments.includes('aspiring_restaurateur')) leadScore += 15;
      if (segments.includes('event_planner')) leadScore += 15;

      // Mask phone
      const maskedPhone = user.phone_number.replace(/(\+\d{2})(\d{3})(\d+)(\d{3})/, '$1 $2****$4');

      for (const segment of segments) {
        segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
        
        if (!segmentUsers[segment]) {
          segmentUsers[segment] = [];
        }
        
        segmentUsers[segment].push({
          userId: user.user_id,
          name: user.name,
          phone: maskedPhone,
          messageCount,
          callCount,
          lastInteraction: user.last_interaction,
          leadScore: Math.min(leadScore, 100),
        });
      }
    }

    // Sort users within each segment by lead score
    for (const segment of Object.keys(segmentUsers)) {
      segmentUsers[segment].sort((a, b) => b.leadScore - a.leadScore);
    }

    // Format segments with stats
    const segments = Object.entries(SEGMENT_DEFINITIONS).map(([id, def]) => ({
      id,
      ...def,
      count: segmentCounts[id] || 0,
      topUsers: (segmentUsers[id] || []).slice(0, 5),
      avgLeadScore: segmentUsers[id]?.length > 0
        ? Math.round(segmentUsers[id].reduce((sum, u) => sum + u.leadScore, 0) / segmentUsers[id].length)
        : 0,
    })).sort((a, b) => b.count - a.count);

    // Calculate total segmented users
    const totalSegmentedUsers = new Set(
      Object.values(segmentUsers).flatMap(users => users.map(u => u.userId))
    ).size;

    // High-value leads (lead score > 60)
    const allUsers = Object.values(segmentUsers).flat();
    const uniqueUsers = Array.from(
      new Map(allUsers.map(u => [u.userId, u])).values()
    );
    const highValueLeads = uniqueUsers
      .filter(u => u.leadScore > 60)
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      segments: {
        list: segments,
        totalUsers: userMessages.length,
        totalSegmentedUsers,
        summary: {
          topSegment: segments[0]?.name || 'N/A',
          topSegmentCount: segments[0]?.count || 0,
          highValueLeads: highValueLeads.length,
          insights: [
            segments[0]?.count > 0 
              ? `${segments[0].count} utenti sono "${segments[0].name}" - target ideale per partnership ${segments[0].id === 'aspiring_restaurateur' ? 'con fornitori attrezzature' : segments[0].id === 'wine_enthusiast' ? 'con cantine' : 'nel settore food'}.`
              : 'Raccogli più conversazioni per identificare segmenti.',
            highValueLeads.length > 0
              ? `Hai ${highValueLeads.length} lead ad alto potenziale per collaborazioni commerciali.`
              : 'Non ci sono ancora lead ad alto valore.',
          ],
        },
        highValueLeads,
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
