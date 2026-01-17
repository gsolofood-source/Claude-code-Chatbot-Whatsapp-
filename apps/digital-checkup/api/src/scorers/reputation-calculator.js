import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTrendScore } from '../analyzers/trend-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load reputation weights
const weightsPath = path.join(__dirname, '../../config/reputation-weights.json');
const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf-8'));

/**
 * Calculate final reputation score (0-100) based on all metrics
 *
 * @param {Object} googleData - Google reviews data
 * @param {Object} tripadvisorData - TripAdvisor reviews data (optional)
 * @param {Object} trendAnalysis - Trend analysis results
 * @param {Object} sentimentAnalysis - AI sentiment analysis
 * @returns {Object} Final score with breakdown
 */
export function calculateReputationScore(googleData, tripadvisorData, trendAnalysis, sentimentAnalysis) {
  // Calculate individual metric scores
  const scores = {
    rating_quality: calculateRatingQuality(googleData, tripadvisorData),
    review_volume: calculateVolumeScore(googleData, tripadvisorData),
    trend_direction: getTrendScore(trendAnalysis),
    recency: calculateRecencyScore(googleData, tripadvisorData),
    owner_response: calculateResponseScore(googleData, tripadvisorData),
    sentiment_ai: sentimentAnalysis.sentiment_score
  };

  // Calculate weighted final score
  let finalScore = 0;
  const breakdown = {};

  for (const [metric, weight] of Object.entries(weights)) {
    const score = scores[metric] || 0;
    const contribution = (score * weight) / 100;
    finalScore += contribution;

    breakdown[metric] = {
      score: Math.round(score),
      weight,
      contribution: parseFloat(contribution.toFixed(2))
    };
  }

  return {
    finalScore: Math.round(finalScore),
    breakdown,
    ratings: getRatings(breakdown)
  };
}

/**
 * Calculate rating quality score (0-100)
 * Weighted average of Google and TripAdvisor ratings
 */
function calculateRatingQuality(googleData, tripadvisorData) {
  let totalRating = 0;
  let totalWeight = 0;

  // Google (higher weight due to more users)
  if (googleData?.rating) {
    const googleScore = (googleData.rating / 5) * 100;
    totalRating += googleScore * 0.6; // 60% weight
    totalWeight += 0.6;
  }

  // TripAdvisor
  if (tripadvisorData?.rating) {
    const taScore = (tripadvisorData.rating / 5) * 100;
    totalRating += taScore * 0.4; // 40% weight
    totalWeight += 0.4;
  }

  return totalWeight > 0 ? totalRating / totalWeight : 0;
}

/**
 * Calculate volume score (0-100) based on total review count
 * Logarithmic scale - diminishing returns after 200 reviews
 */
function calculateVolumeScore(googleData, tripadvisorData) {
  const totalReviews = (googleData?.totalReviews || 0) + (tripadvisorData?.totalReviews || 0);

  if (totalReviews >= 500) return 100;
  if (totalReviews >= 300) return 95;
  if (totalReviews >= 200) return 90;
  if (totalReviews >= 100) return 80;
  if (totalReviews >= 50) return 65;
  if (totalReviews >= 20) return 50;
  if (totalReviews >= 10) return 35;
  if (totalReviews >= 5) return 20;
  return totalReviews * 3; // < 5 reviews
}

/**
 * Calculate recency score (0-100) based on recent review activity
 * Reviews in last 30 days indicate active engagement
 */
function calculateRecencyScore(googleData, tripadvisorData) {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  let recentCount = 0;

  // Count Google reviews in last 30 days
  if (googleData?.reviews) {
    recentCount += googleData.reviews.filter(r => {
      const reviewDate = new Date(r.date).getTime();
      return reviewDate >= thirtyDaysAgo;
    }).length;
  }

  // Count TripAdvisor reviews in last 30 days
  if (tripadvisorData?.reviews) {
    recentCount += tripadvisorData.reviews.filter(r => {
      const reviewDate = new Date(r.date).getTime();
      return reviewDate >= thirtyDaysAgo;
    }).length;
  }

  if (recentCount >= 20) return 100;
  if (recentCount >= 15) return 95;
  if (recentCount >= 10) return 85;
  if (recentCount >= 5) return 70;
  if (recentCount >= 3) return 55;
  if (recentCount >= 1) return 35;
  return 0; // No recent reviews is concerning
}

/**
 * Calculate owner response score (0-100)
 * Percentage of reviews with owner responses
 */
function calculateResponseScore(googleData, tripadvisorData) {
  let totalResponses = 0;
  let totalReviews = 0;

  // Google response rate
  if (googleData?.responseRate !== undefined) {
    totalResponses += googleData.responseRate;
    totalReviews += 100;
  }

  // TripAdvisor response rate
  if (tripadvisorData?.responseRate !== undefined) {
    totalResponses += tripadvisorData.responseRate;
    totalReviews += 100;
  }

  if (totalReviews === 0) return 50; // Neutral if no data

  const avgResponseRate = totalResponses / (totalReviews / 100);

  if (avgResponseRate >= 80) return 100;
  if (avgResponseRate >= 60) return 85;
  if (avgResponseRate >= 40) return 70;
  if (avgResponseRate >= 20) return 50;
  return avgResponseRate * 2; // < 20%
}

/**
 * Get rating labels for each metric
 */
function getRatings(breakdown) {
  const ratings = {};

  for (const [metric, data] of Object.entries(breakdown)) {
    ratings[metric] = getRatingLabel(data.score);
  }

  return ratings;
}

/**
 * Get human-readable rating label
 */
export function getRatingLabel(score) {
  if (score >= 90) return 'Eccellente';
  if (score >= 80) return 'Ottimo';
  if (score >= 70) return 'Buono';
  if (score >= 60) return 'Discreto';
  if (score >= 50) return 'Sufficiente';
  if (score >= 40) return 'Migliorabile';
  return 'Critico';
}

/**
 * Generate reputation summary with insights
 */
export function generateReputationSummary(result, trendAnalysis, sentimentAnalysis) {
  const { finalScore, breakdown } = result;

  // Identify strong areas (score >= 75)
  const strongAreas = [];
  const weakAreas = [];

  const labels = {
    rating_quality: 'Qualità valutazioni',
    review_volume: 'Volume recensioni',
    trend_direction: 'Trend temporale',
    recency: 'Attività recente',
    owner_response: 'Risposta del proprietario',
    sentiment_ai: 'Sentiment positivo'
  };

  for (const [metric, data] of Object.entries(breakdown)) {
    if (data.score >= 75) {
      strongAreas.push(labels[metric]);
    } else if (data.score < 60) {
      weakAreas.push(labels[metric]);
    }
  }

  // Status determination
  let status = 'Reputazione Buona';
  if (finalScore >= 85) status = 'Reputazione Eccellente';
  else if (finalScore >= 75) status = 'Reputazione Molto Buona';
  else if (finalScore >= 65) status = 'Reputazione Buona';
  else if (finalScore >= 55) status = 'Reputazione Discreta';
  else if (finalScore >= 45) status = 'Reputazione Sufficiente';
  else status = 'Reputazione Critica';

  // Risk level based on trend
  let riskLevel = 'LOW';
  if (trendAnalysis.overall_direction === 'DECLINING') {
    riskLevel = Math.abs(trendAnalysis.momentum) > 0.2 ? 'HIGH' : 'MEDIUM';
  }
  if (finalScore < 50) riskLevel = 'HIGH';

  // Build recommendations
  const recommendations = [];

  // Priority 1: Critical issues from sentiment
  if (sentimentAnalysis.critical_issues?.length > 0) {
    const topIssue = sentimentAnalysis.critical_issues[0];
    if (topIssue.severity === 'HIGH') {
      recommendations.push(`URGENTE: Risolvere "${topIssue.issue}" (menzionato ${topIssue.frequency} volte)`);
    }
  }

  // Priority 2: Low response rate
  if (breakdown.owner_response.score < 50) {
    recommendations.push('Aumentare il response rate alle recensioni (target: 60%+)');
  }

  // Priority 3: Declining trend
  if (trendAnalysis.overall_direction === 'DECLINING') {
    recommendations.push('Indagare cause del trend negativo e implementare azioni correttive immediate');
  }

  // Priority 4: Low recency
  if (breakdown.recency.score < 50) {
    recommendations.push('Stimolare nuove recensioni dai clienti soddisfatti');
  }

  // Add AI recommendations
  if (sentimentAnalysis.recommendations?.length > 0) {
    recommendations.push(...sentimentAnalysis.recommendations.slice(0, 3 - recommendations.length));
  }

  return {
    status,
    strongAreas,
    weakAreas,
    recommendations: recommendations.slice(0, 5), // Max 5
    riskLevel
  };
}
