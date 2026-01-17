/**
 * Unified Response Wrapper for MCP Tools
 * Ensures consistent output structure for LLM agents (Joe on n8n)
 *
 * All tools return the same envelope structure regardless of analysis type
 */

/**
 * Score labels in Italian (matching existing scoring system)
 */
export const SCORE_LABELS = {
  EXCELLENT: 'Eccellente',      // 85-100
  VERY_GOOD: 'Ottimo',          // 75-84
  GOOD: 'Buono',                // 60-74
  FAIR: 'Discreto',             // 50-59
  NEEDS_WORK: 'Necessita Intervento'  // < 50
};

/**
 * Get score label from numeric score
 */
export function getScoreLabel(score) {
  if (score === null || score === undefined) return null;
  if (score >= 85) return SCORE_LABELS.EXCELLENT;
  if (score >= 75) return SCORE_LABELS.VERY_GOOD;
  if (score >= 60) return SCORE_LABELS.GOOD;
  if (score >= 50) return SCORE_LABELS.FAIR;
  return SCORE_LABELS.NEEDS_WORK;
}

/**
 * Extract score from tool result based on tool type
 */
function extractScore(toolName, data) {
  switch (toolName) {
    case 'analyze_instagram':
      return data?.score?.finalScore ?? null;
    case 'analyze_website':
      return data?.score?.finalScore ?? null;
    case 'analyze_reviews':
      return data?.score?.finalScore ?? null;
    case 'analyze_gmb':
      return data?.completeness?.finalScore ?? null;
    case 'analyze_global':
      return data?.globalScore ?? null;
    case 'inspect_instagram':
      return null; // No score for inspect
    default:
      return null;
  }
}

/**
 * Extract risk level from tool result
 */
function extractRiskLevel(toolName, data) {
  switch (toolName) {
    case 'analyze_reviews':
      return data?.scoreSummary?.riskLevel ?? null;
    case 'analyze_global':
      return data?.riskLevel ?? null;
    case 'analyze_website':
      return data?.summary?.riskLevel ?? null;
    default:
      return null;
  }
}

/**
 * Build unified summary from tool-specific data
 */
function buildUnifiedSummary(toolName, data) {
  const summary = {
    headline: '',
    status: '',
    strengths: [],
    weaknesses: [],
    recommendations: [],
    keyInsight: null
  };

  try {
    switch (toolName) {
      case 'analyze_instagram': {
        const exec = data?.executiveSummary || {};
        summary.headline = `Analisi Instagram @${data?.profile?.username || 'unknown'}`;
        summary.status = exec.status || getScoreLabel(extractScore(toolName, data)) || 'Analisi completata';
        summary.strengths = exec.strongAreas || [];
        summary.weaknesses = exec.weakAreas || [];
        summary.recommendations = exec.recommendations || [];
        summary.keyInsight = exec.keyInsight || null;
        break;
      }

      case 'analyze_website': {
        const sum = data?.summary || {};
        summary.headline = `Analisi sito web ${data?.website?.url || 'unknown'}`;
        summary.status = sum.status || getScoreLabel(extractScore(toolName, data)) || 'Analisi completata';
        summary.strengths = sum.strongAreas || [];
        summary.weaknesses = sum.weakAreas || [];
        summary.recommendations = sum.recommendations || [];
        summary.keyInsight = sum.keyInsight || null;
        break;
      }

      case 'analyze_reviews': {
        const scoreSummary = data?.scoreSummary || {};
        const exec = data?.executiveSummary || {};
        summary.headline = `Analisi reputazione ${data?.business?.name || 'unknown'}`;
        summary.status = scoreSummary.status || getScoreLabel(extractScore(toolName, data)) || 'Analisi completata';
        summary.strengths = scoreSummary.strongAreas || [];
        summary.weaknesses = scoreSummary.weakAreas || [];
        summary.recommendations = scoreSummary.recommendations || [];
        summary.keyInsight = exec.key_insight || null;
        break;
      }

      case 'analyze_gmb': {
        const completeness = data?.completeness || {};
        summary.headline = `Analisi GMB ${data?.business?.name || 'unknown'}`;
        summary.status = getScoreLabel(completeness.finalScore) || 'Analisi completata';
        summary.strengths = [];
        summary.weaknesses = [];
        summary.recommendations = completeness.recommendations || [];
        summary.keyInsight = null;

        // Extract strengths/weaknesses from breakdown
        if (completeness.breakdown) {
          for (const [key, section] of Object.entries(completeness.breakdown)) {
            if (section.score >= 80) {
              summary.strengths.push(`${key}: ${section.details}`);
            } else if (section.score < 50) {
              summary.weaknesses.push(`${key}: ${section.details}`);
            }
          }
        }
        break;
      }

      case 'analyze_global': {
        const globalSummary = data?.summary || {};
        const metadata = data?.metadata || {};

        // Build headline with partial success indicator
        let headline = `Analisi globale ${data?.business?.name || 'unknown'}`;
        if (metadata.partialSuccess) {
          headline += ` (${metadata.analyzedPillars}/${metadata.requestedPillars} analisi completate)`;
        }

        summary.headline = headline;
        summary.status = globalSummary.status || getScoreLabel(extractScore(toolName, data)) || 'Analisi completata';
        summary.strengths = globalSummary.strongAreas || [];
        summary.weaknesses = globalSummary.criticalAreas || [];
        summary.recommendations = globalSummary.recommendations || [];
        summary.keyInsight = globalSummary.keyInsight || null;

        // Add failed pillars info to weaknesses if partial success
        if (globalSummary.failedPillars && globalSummary.failedPillars.length > 0) {
          const failureMessages = globalSummary.failedPillars.map(
            fp => `${fp.pillar}: ${fp.error}`
          );
          summary.weaknesses = [
            ...summary.weaknesses,
            ...failureMessages.map(m => `[ERRORE] ${m}`)
          ];
        }
        break;
      }

      case 'inspect_instagram': {
        summary.headline = `Ispezione rapida @${data?.profile?.username || 'unknown'}`;
        summary.status = 'Ispezione completata (senza AI)';
        summary.strengths = [];
        summary.weaknesses = [];
        summary.recommendations = [];
        summary.keyInsight = `${data?.profile?.followers || 0} follower, ${data?.metrics?.engagement_rate || 0}% engagement rate`;
        break;
      }
    }
  } catch (error) {
    summary.headline = `Analisi ${toolName} completata con warning`;
    summary.status = 'Completata con warning';
  }

  return summary;
}

/**
 * Build data retrieval status from tool execution
 */
function buildDataRetrievalStatus(toolName, data, errors = {}) {
  const timestamp = new Date().toISOString();
  const status = {};

  switch (toolName) {
    case 'analyze_instagram':
    case 'inspect_instagram':
      status.instagram = {
        success: !errors.instagram,
        error: errors.instagram || null,
        retrieved: data?.profile ? true : false,
        details: data?.profile ? `@${data.profile.username} - ${data.profile.followers} follower` : null
      };
      break;

    case 'analyze_website':
      status.website = {
        success: !errors.website,
        error: errors.website || null,
        retrieved: data?.website ? true : false,
        details: data?.website ? data.website.url : null
      };
      break;

    case 'analyze_reviews':
      status.google_reviews = {
        success: !errors.google_reviews,
        error: errors.google_reviews || null,
        retrieved: data?.reviews?.length > 0,
        details: data?.reviews ? `${data.reviews.length} recensioni trovate` : null
      };
      break;

    case 'analyze_gmb':
      status.gmb = {
        success: !errors.gmb,
        error: errors.gmb || null,
        retrieved: data?.business ? true : false,
        details: data?.business ? `${data.business.name} - ${data.business.rating}*` : null
      };
      break;

    case 'analyze_global': {
      // For global, use errors from the data itself (global-service now tracks them)
      const dataErrors = data?.errors || {};

      // Reputation/Reviews pillar
      const repPillar = data?.pillars?.reputation;
      status.google_reviews = {
        success: repPillar?.status === 'success',
        error: repPillar?.error || dataErrors.reputation || null,
        retrieved: repPillar?.status === 'success',
        details: repPillar?.score ? `Score: ${repPillar.score}` : null
      };

      // GMB pillar
      const gmbPillar = data?.pillars?.googleBusiness;
      status.gmb = {
        success: gmbPillar?.status === 'success',
        error: gmbPillar?.error || dataErrors.googleBusiness || null,
        retrieved: gmbPillar?.status === 'success',
        details: gmbPillar?.score ? `Score: ${gmbPillar.score}` : null
      };

      // Instagram pillar
      const igPillar = data?.pillars?.instagram;
      status.instagram = {
        success: igPillar?.status === 'success',
        error: igPillar?.error || dataErrors.instagram || (!igPillar ? 'Non richiesto' : null),
        retrieved: igPillar?.status === 'success',
        details: igPillar?.score ? `Score: ${igPillar.score}` : null
      };

      // Website pillar
      const webPillar = data?.pillars?.website;
      status.website = {
        success: webPillar?.status === 'success',
        error: webPillar?.error || dataErrors.website || (!webPillar ? 'Non richiesto' : null),
        retrieved: webPillar?.status === 'success',
        details: webPillar?.score ? `Score: ${webPillar.score}` : null
      };
      break;
    }
  }

  // Add timestamp to all
  for (const key of Object.keys(status)) {
    status[key].timestamp = timestamp;
  }

  return status;
}

/**
 * Wrap a successful tool response in the unified format
 *
 * @param {string} toolName - The name of the tool that was called
 * @param {Object} data - The original tool response data
 * @param {Object} errors - Optional object with source-specific errors (for partial failures)
 * @returns {Object} Unified response envelope
 */
export function wrapSuccess(toolName, data, errors = {}) {
  const score = extractScore(toolName, data);

  return {
    toolName,
    success: true,
    timestamp: new Date().toISOString(),

    // Core metrics
    score,
    scoreLabel: getScoreLabel(score),
    riskLevel: extractRiskLevel(toolName, data),

    // Data retrieval status
    dataRetrieval: buildDataRetrievalStatus(toolName, data, errors),

    // Unified summary
    summary: buildUnifiedSummary(toolName, data),

    // Original data preserved
    data
  };
}

/**
 * Wrap a failed tool response in the unified format
 *
 * @param {string} toolName - The name of the tool that was called
 * @param {Error|string} error - The error that occurred
 * @param {Object} partialData - Optional partial data if some analysis completed
 * @returns {Object} Unified error response envelope
 */
export function wrapError(toolName, error, partialData = null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = error instanceof Error ? error.constructor.name : 'Error';

  // Determine which data source failed based on error message
  const errors = {};
  if (errorMessage.includes('Instagram') || errorMessage.includes('instagram') || errorMessage.includes('profile')) {
    errors.instagram = errorMessage;
  }
  if (errorMessage.includes('website') || errorMessage.includes('Website') || errorMessage.includes('URL') || errorMessage.includes('fetch')) {
    errors.website = errorMessage;
  }
  if (errorMessage.includes('review') || errorMessage.includes('Review') || errorMessage.includes('Google') || errorMessage.includes('Places')) {
    errors.google_reviews = errorMessage;
  }
  if (errorMessage.includes('GMB') || errorMessage.includes('Business')) {
    errors.gmb = errorMessage;
  }

  // If no specific source identified, mark the primary source for this tool
  if (Object.keys(errors).length === 0) {
    switch (toolName) {
      case 'analyze_instagram':
      case 'inspect_instagram':
        errors.instagram = errorMessage;
        break;
      case 'analyze_website':
        errors.website = errorMessage;
        break;
      case 'analyze_reviews':
        errors.google_reviews = errorMessage;
        break;
      case 'analyze_gmb':
        errors.gmb = errorMessage;
        break;
      case 'analyze_global':
        errors.general = errorMessage;
        break;
    }
  }

  return {
    toolName,
    success: false,
    timestamp: new Date().toISOString(),

    // Core metrics - all null on failure
    score: null,
    scoreLabel: null,
    riskLevel: null,

    // Error details
    error: {
      message: errorMessage,
      type: errorType,
      source: Object.keys(errors)[0] || 'unknown'
    },

    // Data retrieval status showing what failed
    dataRetrieval: buildDataRetrievalStatus(toolName, partialData, errors),

    // Summary explaining the failure
    summary: {
      headline: `Errore durante ${toolName}`,
      status: 'Errore',
      strengths: [],
      weaknesses: [],
      recommendations: [
        `Verificare i parametri forniti`,
        `Controllare la connessione di rete`,
        `Riprovare tra qualche minuto`
      ],
      keyInsight: errorMessage
    },

    // Partial data if available
    data: partialData
  };
}

/**
 * Wrap response with partial success (some pillars failed in global analysis)
 *
 * @param {string} toolName - The tool name (usually 'analyze_global')
 * @param {Object} data - The analysis data
 * @param {Object} pillarErrors - Object with errors for each failed pillar
 * @returns {Object} Unified response with partial success noted
 */
export function wrapPartialSuccess(toolName, data, pillarErrors = {}) {
  const response = wrapSuccess(toolName, data, pillarErrors);

  // Update summary to reflect partial success
  const failedPillars = Object.entries(pillarErrors)
    .filter(([_, error]) => error)
    .map(([pillar, error]) => `${pillar}: ${error}`);

  if (failedPillars.length > 0) {
    response.summary.headline += ` (${failedPillars.length} fonte/i non disponibile/i)`;
    response.summary.weaknesses = [
      ...response.summary.weaknesses,
      ...failedPillars.map(p => `Dati non recuperati: ${p}`)
    ];
  }

  return response;
}

export default {
  wrapSuccess,
  wrapError,
  wrapPartialSuccess,
  getScoreLabel,
  SCORE_LABELS
};
