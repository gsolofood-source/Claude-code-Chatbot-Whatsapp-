import { NextResponse } from "next/server";
import { query, safeInt } from "@/lib/db";

export const dynamic = "force-dynamic";

// Common Italian stop words to filter out
const STOP_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'e', 'o', 'ma', 'che', 'chi', 'come', 'dove', 'quando', 'perché',
  'non', 'sì', 'no', 'mi', 'ti', 'ci', 'vi', 'si', 'ne',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'sono', 'sei', 'è', 'siamo', 'siete', 'essere',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella',
  'mio', 'mia', 'tuo', 'tua', 'suo', 'sua',
  'più', 'molto', 'poco', 'tutto', 'tanto',
  'ciao', 'grazie', 'prego', 'scusa', 'buongiorno', 'buonasera',
  'joe', 'bastianich', 'ok', 'va', 'bene', 'cosa', 'fare',
  'vorrei', 'voglio', 'posso', 'puoi', 'devo', 'può',
  'del', 'della', 'dei', 'degli', 'delle', 'al', 'alla', 'ai', 'alle',
  'nel', 'nella', 'nei', 'negli', 'nelle', 'sul', 'sulla',
  'anche', 'ancora', 'già', 'sempre', 'mai', 'solo',
]);

// Business-related keywords to track
const BUSINESS_KEYWORDS: Record<string, string[]> = {
  'ristorante': ['ristorante', 'ristoranti', 'locale', 'locali', 'aprire', 'gestione', 'gestire'],
  'menu': ['menu', 'menù', 'piatti', 'pietanze', 'ricette', 'cucina'],
  'personale': ['personale', 'staff', 'camerieri', 'cuochi', 'chef', 'dipendenti', 'assumere'],
  'location': ['location', 'posizione', 'zona', 'quartiere', 'città', 'affitto', 'locale'],
  'marketing': ['marketing', 'social', 'instagram', 'pubblicità', 'promozione', 'clienti'],
  'finanze': ['soldi', 'investimento', 'capitale', 'costi', 'guadagno', 'fatturato', 'budget'],
  'fornitori': ['fornitori', 'prodotti', 'ingredienti', 'qualità', 'materie prime'],
  'licenze': ['licenze', 'permessi', 'burocrazia', 'autorizzazioni', 'scia', 'haccp'],
  'vino': ['vino', 'vini', 'cantina', 'sommelier', 'bottiglia', 'calice'],
  'eventi': ['eventi', 'catering', 'matrimoni', 'feste', 'private', 'cena'],
};

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sàèéìòù]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function categorizeMessage(text: string): string[] {
  const lowerText = text.toLowerCase();
  const categories: string[] = [];
  
  for (const [category, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      categories.push(category);
    }
  }
  
  return categories.length > 0 ? categories : ['generale'];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = safeInt(searchParams.get("days"), 1, 90, 30); // Max 90 days
  const minOccurrences = safeInt(searchParams.get("minOccurrences"), 1, 100, 3);

  try {
    // Fetch user messages with parameterized interval
    const messages = await query<{ content: string; created_at: string }>(`
      SELECT content, created_at
      FROM messages
      WHERE role = 'user'
        AND message_type = 'text'
        AND created_at >= NOW() - ($1 || ' days')::interval
      ORDER BY created_at DESC
    `, [days.toString()]);

    // Word frequency analysis
    const wordFrequency: Record<string, number> = {};
    const categoryFrequency: Record<string, number> = {};
    const categoryExamples: Record<string, string[]> = {};

    for (const msg of messages) {
      // Extract and count keywords
      const keywords = extractKeywords(msg.content);
      for (const word of keywords) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }

      // Categorize message
      const categories = categorizeMessage(msg.content);
      for (const category of categories) {
        categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
        
        // Store example messages (max 3 per category)
        if (!categoryExamples[category]) {
          categoryExamples[category] = [];
        }
        if (categoryExamples[category].length < 3 && msg.content.length > 20) {
          categoryExamples[category].push(
            msg.content.length > 100 
              ? msg.content.substring(0, 100) + '...' 
              : msg.content
          );
        }
      }
    }

    // Top keywords (word cloud data)
    const topKeywords = Object.entries(wordFrequency)
      .filter(([_, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));

    // Topic distribution - prevent division by zero
    const totalMsgCount = messages.length || 1;
    const topicDistribution = Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: Math.round((count / totalMsgCount) * 100),
        examples: categoryExamples[topic] || [],
      }));

    // Top topic
    const topTopic = topicDistribution[0];

    // FAQ-like patterns (questions)
    const questions = messages
      .filter(m => m.content.includes('?'))
      .map(m => m.content)
      .slice(0, 20);

    // Common question patterns - using subquery to avoid GROUP BY alias issue
    const questionPatterns = await query<{ pattern: string; count: string }>(`
      SELECT pattern, COUNT(*) as count
      FROM (
        SELECT 
          CASE
            WHEN LOWER(content) LIKE '%come%' THEN 'Come fare...'
            WHEN LOWER(content) LIKE '%quanto%' THEN 'Quanto costa/serve...'
            WHEN LOWER(content) LIKE '%dove%' THEN 'Dove trovare...'
            WHEN LOWER(content) LIKE '%perché%' OR LOWER(content) LIKE '%perche%' THEN 'Perché...'
            WHEN LOWER(content) LIKE '%cosa%' THEN 'Cosa fare/significa...'
            WHEN LOWER(content) LIKE '%posso%' OR LOWER(content) LIKE '%puoi%' THEN 'Posso/Puoi...'
            WHEN LOWER(content) LIKE '%consiglio%' OR LOWER(content) LIKE '%consigli%' THEN 'Richiesta consiglio'
            ELSE 'Altro'
          END as pattern
        FROM messages
        WHERE role = 'user'
          AND message_type = 'text'
          AND content LIKE '%?%'
          AND created_at >= NOW() - ($1 || ' days')::interval
      ) patterns
      GROUP BY pattern
      ORDER BY count DESC
    `, [days.toString()]);

    return NextResponse.json({
      success: true,
      topics: {
        wordCloud: topKeywords,
        distribution: topicDistribution,
        totalMessages: messages.length,
        insights: {
          topTopic: topTopic?.topic || 'N/A',
          topTopicPercentage: topTopic?.percentage || 0,
          recommendation: topTopic 
            ? `Il ${topTopic.percentage}% delle conversazioni riguarda "${topTopic.topic}". Potresti creare contenuti specifici su questo tema.`
            : 'Raccogli più dati per insights significativi.',
        },
        questionPatterns: questionPatterns.map(q => ({
          pattern: q.pattern,
          count: parseInt(q.count),
        })),
        sampleQuestions: questions.slice(0, 10),
      },
      period: `${days} days`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
