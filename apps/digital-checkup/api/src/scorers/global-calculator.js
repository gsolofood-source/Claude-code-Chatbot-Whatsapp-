import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load global weights
const weightsPath = path.join(__dirname, '../../config/global-weights.json');
const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf-8'));

/**
 * Calculate global digital presence score (0-100)
 * Aggregates scores from all four pillars: reputation, GMB, Instagram, website
 *
 * @param {Object} pillarScores - Scores from each pillar
 * @param {number} pillarScores.reputation - Reputation score (0-100)
 * @param {number} pillarScores.googleBusiness - GMB completeness score (0-100)
 * @param {number} pillarScores.instagram - Instagram score (0-100)
 * @param {number} pillarScores.website - Website score (0-100)
 * @returns {Object} Global score with breakdown and recommendations
 */
export function calculateGlobalScore(pillarScores) {
  const {
    reputation = null,
    googleBusiness = null,
    instagram = null,
    website = null
  } = pillarScores;

  // Count available pillars
  const availablePillars = {
    reputation: reputation !== null,
    google_business: googleBusiness !== null,
    instagram: instagram !== null,
    website: website !== null
  };

  const availableCount = Object.values(availablePillars).filter(Boolean).length;

  if (availableCount === 0) {
    throw new Error('At least one pillar score is required to calculate global score');
  }

  // Redistribute weights if some pillars are missing
  const adjustedWeights = redistributeWeights(weights, availablePillars);

  // Calculate weighted score
  let finalScore = 0;
  const breakdown = {};

  const scores = {
    reputation: reputation,
    google_business: googleBusiness,
    instagram: instagram,
    website: website
  };

  for (const [pillar, score] of Object.entries(scores)) {
    if (score !== null) {
      const weight = adjustedWeights[pillar];
      const contribution = (score * weight) / 100;
      finalScore += contribution;

      breakdown[pillar] = {
        score: Math.round(score),
        weight: weight,
        originalWeight: weights[pillar],
        contribution: parseFloat(contribution.toFixed(2)),
        available: true
      };
    } else {
      breakdown[pillar] = {
        score: null,
        weight: 0,
        originalWeight: weights[pillar],
        contribution: 0,
        available: false
      };
    }
  }

  return {
    finalScore: Math.round(finalScore),
    breakdown,
    availablePillars: availableCount,
    totalPillars: 4,
    completeness: (availableCount / 4) * 100
  };
}

/**
 * Redistributes weights proportionally when some pillars are missing
 *
 * @param {Object} originalWeights - Original weight configuration
 * @param {Object} availablePillars - Boolean map of available pillars
 * @returns {Object} Adjusted weights that sum to 100
 */
function redistributeWeights(originalWeights, availablePillars) {
  const adjusted = {};
  let totalOriginalWeight = 0;
  let totalAvailableWeight = 0;

  // Calculate total weight of available pillars
  for (const [pillar, isAvailable] of Object.entries(availablePillars)) {
    totalOriginalWeight += originalWeights[pillar];
    if (isAvailable) {
      totalAvailableWeight += originalWeights[pillar];
    }
  }

  // Redistribute proportionally
  for (const [pillar, isAvailable] of Object.entries(availablePillars)) {
    if (isAvailable) {
      // Scale up the weight proportionally
      adjusted[pillar] = (originalWeights[pillar] / totalAvailableWeight) * 100;
    } else {
      adjusted[pillar] = 0;
    }
  }

  return adjusted;
}

/**
 * Generate comprehensive executive summary for global score
 *
 * @param {Object} globalResult - Global score result
 * @param {Object} pillarDetails - Detailed results from each pillar
 * @returns {Object} Executive summary with insights and recommendations
 */
export function generateGlobalSummary(globalResult, pillarDetails) {
  const { finalScore, breakdown } = globalResult;

  // Identify strongest and weakest pillars
  const availablePillars = Object.entries(breakdown)
    .filter(([_, data]) => data.available)
    .map(([pillar, data]) => ({ pillar, ...data }))
    .sort((a, b) => b.score - a.score);

  const strongestPillar = availablePillars[0];
  const weakestPillar = availablePillars[availablePillars.length - 1];

  // Categorize pillars
  const strongAreas = availablePillars
    .filter(p => p.score >= 75)
    .map(p => getPillarLabel(p.pillar));

  const criticalAreas = availablePillars
    .filter(p => p.score < 60)
    .map(p => getPillarLabel(p.pillar));

  // Determine overall status
  let status = 'Presenza Digitale Buona';
  if (finalScore >= 85) status = 'Presenza Digitale Eccellente';
  else if (finalScore >= 75) status = 'Presenza Digitale Molto Buona';
  else if (finalScore >= 65) status = 'Presenza Digitale Buona';
  else if (finalScore >= 55) status = 'Presenza Digitale Discreta';
  else if (finalScore >= 45) status = 'Presenza Digitale Sufficiente';
  else status = 'Presenza Digitale Critica';

  // Determine risk level
  let riskLevel = 'LOW';
  if (finalScore < 50) riskLevel = 'HIGH';
  else if (finalScore < 65) riskLevel = 'MEDIUM';

  // Check for specific risks
  if (breakdown.reputation?.score < 60) riskLevel = 'MEDIUM';
  if (breakdown.reputation?.score < 50) riskLevel = 'HIGH';

  // Generate strategic insights
  const keyInsight = generateKeyInsight(breakdown, pillarDetails);

  // Build priority recommendations
  const recommendations = buildPriorityRecommendations(breakdown, pillarDetails);

  return {
    status,
    riskLevel,
    strongAreas,
    criticalAreas,
    keyInsight,
    recommendations: recommendations.slice(0, 5), // Top 5
    strongestPillar: strongestPillar ? {
      name: getPillarLabel(strongestPillar.pillar),
      score: strongestPillar.score
    } : null,
    weakestPillar: weakestPillar ? {
      name: getPillarLabel(weakestPillar.pillar),
      score: weakestPillar.score
    } : null
  };
}

/**
 * Generate strategic insight based on pillar analysis
 */
function generateKeyInsight(breakdown, pillarDetails) {
  const rep = breakdown.reputation;
  const gmb = breakdown.google_business;
  const ig = breakdown.instagram;
  const web = breakdown.website;

  // Reputation-focused insights (highest priority)
  if (rep?.available && rep.score < 60) {
    const trend = pillarDetails.reputation?.trendAnalysis?.overall_direction;
    if (trend === 'DECLINING') {
      return 'La reputazione online è in declino e richiede intervento immediato. Le recensioni sono il fattore più importante per la fiducia dei clienti.';
    }
    return 'La reputazione online è debole. Priorità assoluta: migliorare gestione recensioni e aumentare response rate.';
  }

  // GMB discovery issues
  if (gmb?.available && gmb.score < 60) {
    return 'La scheda Google My Business è incompleta, limitando la discovery locale. Completarla è fondamentale per convertire ricerche in visite.';
  }

  // Balanced but low overall
  if (rep?.score >= 60 && gmb?.score >= 60 && ig?.score < 60) {
    return 'Reputazione e scheda Google solide, ma presenza social debole. Instagram è chiave per generare engagement e prenotazioni.';
  }

  // Strong reputation but weak conversion
  if (rep?.score >= 75 && (gmb?.score < 65 || web?.score < 65)) {
    return 'Ottima reputazione ma opportunità di conversione non ottimizzate. Migliorare GMB e sito per chiudere il cerchio.';
  }

  // All good
  if (rep?.score >= 70 && gmb?.score >= 70 && ig?.score >= 70) {
    return 'Presenza digitale solida su tutti i canali. Focus su ottimizzazione continua e mantenimento del trend positivo.';
  }

  // Generic
  return 'La presenza digitale ha margini di miglioramento. Focus su completezza dei canali e coerenza del brand.';
}

/**
 * Build prioritized recommendations across all pillars
 */
function buildPriorityRecommendations(breakdown, pillarDetails) {
  const recs = [];

  // P0: Critical reputation issues (highest impact on business)
  if (breakdown.reputation?.available && breakdown.reputation.score < 60) {
    const repDetails = pillarDetails.reputation;
    if (repDetails?.responseRate < 30) {
      recs.push('[URGENTE] Rispondere alle recensioni negative (response rate attuale: ' + repDetails.responseRate + '%)');
    }
    if (repDetails?.trendAnalysis?.overall_direction === 'DECLINING') {
      recs.push('[URGENTE] Indagare cause del trend negativo nelle recensioni recenti');
    }
  }

  // P1: GMB discovery gaps (high impact on acquisition)
  if (breakdown.google_business?.available && breakdown.google_business.score < 70) {
    const gmbDetails = pillarDetails.googleBusiness;
    if (gmbDetails?.recommendations?.length > 0) {
      recs.push(...gmbDetails.recommendations.slice(0, 2));
    }
  }

  // P2: Instagram engagement (medium-high impact on brand)
  if (breakdown.instagram?.available && breakdown.instagram.score < 65) {
    const igDetails = pillarDetails.instagram;
    if (igDetails?.recommendations?.length > 0) {
      recs.push(igDetails.recommendations[0]);
    }
  }

  // P3: Website optimization (medium impact on conversion)
  if (breakdown.website?.available && breakdown.website.score < 65) {
    const webDetails = pillarDetails.website;
    if (webDetails?.recommendations?.length > 0) {
      recs.push(webDetails.recommendations[0]);
    }
  }

  // P4: Missing pillars (data completeness)
  if (!breakdown.reputation?.available) {
    recs.push('Attivare monitoraggio recensioni su Google e TripAdvisor per tracking reputazione');
  }
  if (!breakdown.google_business?.available) {
    recs.push('Verificare e completare scheda Google My Business per discovery locale');
  }
  if (!breakdown.instagram?.available) {
    recs.push('Creare presenza Instagram per engagement e brand awareness');
  }
  if (!breakdown.website?.available) {
    recs.push('Sviluppare sito web per completare customer journey');
  }

  return recs;
}

/**
 * Get human-readable pillar label
 */
function getPillarLabel(pillar) {
  const labels = {
    reputation: 'Reputation (Recensioni)',
    google_business: 'Google My Business',
    instagram: 'Instagram Presence',
    website: 'Website Quality'
  };
  return labels[pillar] || pillar;
}

/**
 * Get risk level label and emoji
 */
export function getRiskLevelLabel(riskLevel) {
  const labels = {
    LOW: { text: 'BASSO', emoji: '✅', color: 'green' },
    MEDIUM: { text: 'MEDIO', emoji: '⚠️', color: 'yellow' },
    HIGH: { text: 'ALTO', emoji: '🚨', color: 'red' }
  };
  return labels[riskLevel] || labels.LOW;
}

/**
 * Get pillar emoji
 */
export function getPillarEmoji(pillar) {
  const emojis = {
    reputation: '🌟',
    google_business: '📍',
    instagram: '📱',
    website: '🌐'
  };
  return emojis[pillar] || '📊';
}
