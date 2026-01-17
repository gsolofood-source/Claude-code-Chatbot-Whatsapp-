import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads weight configuration from config/weights.json
 * @returns {Object} Weight configuration
 */
function loadWeights() {
  const weightsPath = path.join(__dirname, '../../config/weights.json');
  const weightsData = fs.readFileSync(weightsPath, 'utf-8');
  return JSON.parse(weightsData);
}

/**
 * Normalizes engagement rate to 0-100 scale based on follower count
 * Uses industry benchmarks for different follower ranges
 * @param {number} engagementRate - Raw engagement rate percentage
 * @param {number} followers - Follower count
 * @returns {number} Normalized score 0-100
 */
function normalizeEngagementRate(engagementRate, followers) {
  let excellent, good, average, poor;

  // Determine thresholds based on follower count
  if (followers < 10000) {
    excellent = 7;
    good = 4;
    average = 2;
    poor = 2;
  } else if (followers < 100000) {
    excellent = 5;
    good = 3;
    average = 1.5;
    poor = 1.5;
  } else if (followers < 1000000) {
    excellent = 3;
    good = 2;
    average = 1;
    poor = 1;
  } else {
    excellent = 1.5;
    good = 0.8;
    average = 0.4;
    poor = 0.4;
  }

  // Score calculation
  if (engagementRate >= excellent) return 100;
  if (engagementRate >= good) {
    // 75-100 range (Good to Excellent)
    return 75 + ((engagementRate - good) / (excellent - good)) * 25;
  }
  if (engagementRate >= average) {
    // 50-75 range (Average to Good)
    return 50 + ((engagementRate - average) / (good - average)) * 25;
  }
  if (engagementRate >= poor) {
    // 25-50 range (Poor to Average)
    return 25 + ((engagementRate - poor) / (average - poor)) * 25;
  }
  // 0-25 range (Very Poor)
  return Math.max(0, (engagementRate / poor) * 25);
}

/**
 * Scores content mix diversity
 * More diverse = better score
 * @param {Object} contentMix - { photo: %, video: %, carousel: % }
 * @returns {number} Score 0-100
 */
function scoreContentMix(contentMix) {
  const { photo = 0, video = 0, carousel = 0 } = contentMix;

  // Calculate diversity using entropy-like measure
  const types = [photo, video, carousel].filter(p => p > 0);

  if (types.length === 1) return 40; // Only one type = poor diversity
  if (types.length === 2) return 70; // Two types = good
  if (types.length === 3) {
    // All three types present - score based on balance
    const variance = Math.abs(photo - 33.3) + Math.abs(video - 33.3) + Math.abs(carousel - 33.3);
    return Math.max(80, 100 - variance / 2);
  }
  return 0;
}

/**
 * Estimates follower trend score
 * Since we can't get historical data, we use heuristics:
 * - High engagement = likely growing
 * - Low engagement = likely stagnant
 * @param {number} engagementRate - Raw engagement rate
 * @param {number} followers - Follower count
 * @returns {number} Score 0-100
 */
function estimateFollowerTrend(engagementRate, followers) {
  // High engagement typically indicates growth
  let score = 50; // Neutral baseline

  if (engagementRate > 3) score += 30;
  else if (engagementRate > 1.5) score += 15;
  else if (engagementRate < 0.5) score -= 20;

  // Larger accounts with good engagement = strong growth signal
  if (followers > 50000 && engagementRate > 2) score += 20;
  else if (followers > 10000 && engagementRate > 1) score += 10;

  return Math.min(100, Math.max(0, score));
}

/**
 * Scores qualitative interactions
 * Based on comment-to-like ratio
 * @param {number} avgLikes - Average likes per post
 * @param {number} avgComments - Average comments per post
 * @returns {number} Score 0-100
 */
function scoreQualitativeInteractions(avgLikes, avgComments) {
  if (avgLikes === 0) return 0;

  const ratio = (avgComments / avgLikes) * 100;

  // Ideal ratio is 2-5% (comments/likes)
  if (ratio >= 2 && ratio <= 5) return 100;
  if (ratio >= 1 && ratio < 2) return 70;
  if (ratio >= 0.5 && ratio < 1) return 50;
  if (ratio > 5) return 80; // Very high engagement can still be good
  return 30; // Very low comment ratio
}

/**
 * Calculates final weighted score
 * @param {Object} metrics - All calculated metrics
 * @param {Object} aiAnalysis - AI analysis results
 * @returns {Object} Final score and breakdown
 */
export function calculateFinalScore(metrics, aiAnalysis) {
  const weights = loadWeights();

  // Normalize metrics to 0-100 scale
  const scores = {
    engagement_rate: normalizeEngagementRate(metrics.engagementRate, metrics.followers),
    follower_trend: estimateFollowerTrend(metrics.engagementRate, metrics.followers),
    content_mix: scoreContentMix(metrics.contentMix),
    copywriting: aiAnalysis.copywriting.score,
    visual_identity: aiAnalysis.visualIdentity.score,
    originality: aiAnalysis.originality.score,
    qualitative_interactions: scoreQualitativeInteractions(
      metrics.avgLikes,
      metrics.avgComments
    )
  };

  // Calculate weighted final score
  let finalScore = 0;
  const breakdown = {};

  for (const [key, score] of Object.entries(scores)) {
    const weight = weights[key];
    const weightedScore = (score * weight) / 100;
    finalScore += weightedScore;
    breakdown[key] = {
      score: Math.round(score),
      weight: weight,
      contribution: Math.round(weightedScore * 10) / 10
    };
  }

  return {
    finalScore: Math.round(finalScore),
    breakdown,
    metrics: {
      engagement_rate: metrics.engagementRate,
      avg_likes: metrics.avgLikes,
      avg_comments: metrics.avgComments,
      content_mix: metrics.contentMix
    }
  };
}

/**
 * Generates a rating label based on score
 * @param {number} score - Final score 0-100
 * @returns {string} Rating label
 */
export function getRatingLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Average';
  if (score >= 30) return 'Below Average';
  return 'Poor';
}
