import Anthropic from '@anthropic-ai/sdk';

/**
 * AI-powered reputation analyzer using Claude
 *
 * Analyzes review sentiment, identifies recurring themes,
 * and provides actionable insights for restaurants.
 */

/**
 * Analyze sentiment and themes from reviews using Claude AI
 *
 * @param {Array} reviews - Combined reviews from all platforms (max 30)
 * @param {Object} metadata - Restaurant metadata (name, platforms, ratings)
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Sentiment analysis with themes and recommendations
 */
export async function analyzeSentiment(reviews, metadata, apiKey) {
  const anthropic = new Anthropic({ apiKey });

  // Prepare review text for analysis (take up to 30 most recent)
  const reviewsToAnalyze = reviews.slice(0, 30);
  const reviewText = reviewsToAnalyze
    .map((r, i) => `Review ${i + 1} (${r.rating}⭐ - ${r.platform || 'unknown'}):\n"${r.text}"`)
    .join('\n\n');

  const prompt = `Sei un esperto di analisi della reputazione per ristoranti. Analizza le seguenti ${reviewsToAnalyze.length} recensioni del ristorante "${metadata.restaurantName}".

RECENSIONI:
${reviewText}

COMPITO:
1. Identifica i TEMI POSITIVI più ricorrenti (massimo 5)
2. Identifica le CRITICITÀ più menzionate (massimo 5)
3. Calcola un SENTIMENT SCORE complessivo (0-100)
4. Fornisci 3 RACCOMANDAZIONI PRIORITARIE concrete e attuabili

FORMATO OUTPUT (JSON):
{
  "sentiment_score": <numero 0-100>,
  "positive_themes": [
    {"theme": "descrizione tema", "frequency": <numero menzioni>}
  ],
  "critical_issues": [
    {"issue": "descrizione problema", "frequency": <numero menzioni>, "severity": "HIGH|MEDIUM|LOW"}
  ],
  "recommendations": [
    "Raccomandazione concreta e specifica"
  ],
  "overall_tone": "MOLTO_POSITIVO|POSITIVO|NEUTRO|NEGATIVO|MOLTO_NEGATIVO"
}

NOTA:
- Il sentiment_score deve riflettere il tono generale (molto positivo = 85-100, positivo = 70-84, neutro = 50-69, negativo = 30-49, molto negativo = 0-29)
- Le raccomandazioni devono essere specifiche e attuabili, non generiche
- Considera sia la frequenza che l'intensità emotiva dei temi`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      sentiment_score: analysis.sentiment_score || 50,
      positive_themes: analysis.positive_themes || [],
      critical_issues: analysis.critical_issues || [],
      recommendations: analysis.recommendations || [],
      overall_tone: analysis.overall_tone || 'NEUTRO',
      reviews_analyzed: reviewsToAnalyze.length
    };

  } catch (error) {
    console.error('Claude API error:', error.message);

    // Fallback: Calculate basic sentiment from ratings
    const avgRating = reviewsToAnalyze.reduce((sum, r) => sum + r.rating, 0) / reviewsToAnalyze.length;
    const sentimentScore = Math.round((avgRating / 5) * 100);

    return {
      sentiment_score: sentimentScore,
      positive_themes: [],
      critical_issues: [],
      recommendations: [
        'Analisi AI non disponibile. Verifica la connessione o le credenziali API.',
        'Rivedi manualmente le recensioni per identificare temi ricorrenti.'
      ],
      overall_tone: sentimentScore >= 80 ? 'POSITIVO' : sentimentScore >= 60 ? 'NEUTRO' : 'NEGATIVO',
      reviews_analyzed: reviewsToAnalyze.length,
      error: 'AI analysis fallback'
    };
  }
}

/**
 * Generate executive summary combining all data
 *
 * @param {Object} googleData - Google reviews data
 * @param {Object} trendAnalysis - Trend analysis results
 * @param {Object} sentimentAnalysis - Sentiment analysis results
 * @param {Object} finalScore - Final reputation score
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Executive summary with status and key insights
 */
export async function generateExecutiveSummary(
  googleData,
  trendAnalysis,
  sentimentAnalysis,
  finalScore,
  apiKey
) {
  const anthropic = new Anthropic({ apiKey });

  const prompt = `Sei un consulente di marketing per ristoranti. Analizza i seguenti dati sulla reputazione online Google e genera un executive summary.

DATI:
- Score Finale: ${finalScore.finalScore}/100
- Google Maps: ${googleData.rating}⭐ (${googleData.totalReviews} recensioni)
- Trend: ${trendAnalysis.overall_direction} (momentum: ${trendAnalysis.momentum})
- Response Rate: ${googleData.responseRate}%
- Sentiment AI: ${sentimentAnalysis.sentiment_score}/100
- Temi positivi: ${sentimentAnalysis.positive_themes.map(t => t.theme).join(', ')}
- Criticità: ${sentimentAnalysis.critical_issues.map(i => i.issue).join(', ')}

GENERA UN EXECUTIVE SUMMARY IN FORMATO JSON:
{
  "status": "<descrizione breve dello stato (es. 'Reputazione Eccellente', 'Buona Reputazione con Margini di Miglioramento', 'Reputazione a Rischio')>",
  "key_insight": "<1-2 frasi: l'insight più importante da questa analisi>",
  "urgency_level": "ALTA|MEDIA|BASSA",
  "prognosis": "<previsione a 6 mesi se continua questo trend>"
}

CRITERI:
- Status "Eccellente" solo se score > 80 E trend positivo
- Urgency "ALTA" se score < 60 O trend in declino rapido
- La prognosi deve essere concreta e basata sul trend attuale`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse summary');
    }

    const summary = JSON.parse(jsonMatch[0]);

    return {
      status: summary.status || 'Analisi in corso',
      key_insight: summary.key_insight || '',
      urgency_level: summary.urgency_level || 'MEDIA',
      prognosis: summary.prognosis || ''
    };

  } catch (error) {
    console.error('Claude API error in summary:', error.message);

    // Fallback summary
    let status = 'Reputazione Buona';
    if (finalScore.finalScore >= 80) status = 'Reputazione Eccellente';
    if (finalScore.finalScore < 60) status = 'Reputazione da Migliorare';
    if (finalScore.finalScore < 45) status = 'Reputazione Critica';

    return {
      status,
      key_insight: `Score complessivo: ${finalScore.finalScore}/100. Trend: ${trendAnalysis.overall_direction}.`,
      urgency_level: finalScore.finalScore < 60 ? 'ALTA' : 'MEDIA',
      prognosis: 'Analisi predittiva non disponibile.',
      error: 'AI summary fallback'
    };
  }
}
