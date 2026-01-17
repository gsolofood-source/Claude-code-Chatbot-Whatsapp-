/**
 * Reputation Analysis Service
 * Pure business logic for restaurant reputation analysis (Google reviews)
 * Used by CLI, MCP stdio server, and MCP HTTP server
 */

import { scrapeGoogleReviews } from '../scrapers/google-reviews.js';
import { analyzeSentiment, generateExecutiveSummary } from '../analyzers/claude-reputation.js';
import { analyzeTrend } from '../analyzers/trend-analyzer.js';
import { calculateReputationScore, generateReputationSummary } from '../scorers/reputation-calculator.js';

/**
 * Analyze restaurant reputation from Google reviews
 *
 * @param {Object} options - Analysis options
 * @param {string} options.businessName - Restaurant name and location
 * @param {string} options.googleApiKey - Google Places API key
 * @param {string} options.anthropicApiKey - Anthropic API key for sentiment analysis
 * @param {string} [options.outscraperApiKey] - Optional Outscraper API key for more reviews (30+)
 * @param {string} [options.placeId] - Optional Google Place ID for precise identification
 * @param {boolean} [options.verbose=false] - Return verbose sentiment analysis
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} Complete reputation analysis results
 */
export async function analyzeReputation(options) {
  const {
    businessName,
    googleApiKey,
    anthropicApiKey,
    outscraperApiKey = null,
    placeId = null,
    verbose = false,
    progressCallback = () => {},
  } = options;

  // Validate required parameters
  if (!businessName) {
    throw new Error('businessName is required');
  }
  if (!googleApiKey) {
    throw new Error('googleApiKey is required');
  }
  if (!anthropicApiKey) {
    throw new Error('anthropicApiKey is required');
  }

  // Step 1: Fetch Google Reviews (uses Outscraper if available, fallback to Google Places API)
  progressCallback('Fetching Google reviews...');
  const googleData = await scrapeGoogleReviews(businessName, googleApiKey, placeId, outscraperApiKey);

  // Step 2: Prepare reviews for analysis
  const allReviews = googleData.reviews.map(r => ({ ...r, platform: 'google' }));

  // Step 3: Trend Analysis
  progressCallback('Analyzing temporal trends...');
  const trendAnalysis = analyzeTrend(allReviews, googleData.rating);

  // Step 4: AI Sentiment Analysis (always required for scoring)
  progressCallback('Analyzing review sentiment with AI...');
  const sentimentAnalysis = allReviews.length > 0
    ? await analyzeSentiment(allReviews, {
        restaurantName: googleData.restaurantName,
        platforms: ['Google']
      }, anthropicApiKey)
    : {
        sentiment_score: 50,
        overall_sentiment: 'NEUTRAL',
        themes: [],
        recommendations: []
      };

  // Step 5: Calculate Final Score
  progressCallback('Calculating reputation score...');
  const scoreResult = calculateReputationScore(googleData, null, trendAnalysis, sentimentAnalysis);
  const scoreSummary = generateReputationSummary(scoreResult, trendAnalysis, sentimentAnalysis);

  // Step 6: Generate Executive Summary
  progressCallback('Generating executive summary...');
  const executiveSummary = await generateExecutiveSummary(
    googleData,
    trendAnalysis,
    sentimentAnalysis,
    scoreResult,
    anthropicApiKey
  );

  // Return complete results
  return {
    business: {
      name: googleData.restaurantName,
      address: googleData.address,
      placeId: googleData.placeId,
      rating: googleData.rating,
      totalReviews: googleData.totalReviews,
      mapsUrl: googleData.mapsUrl,
      multipleResultsWarning: googleData.multipleResultsWarning,
    },
    reviews: googleData.reviews,
    trendAnalysis,
    sentimentAnalysis: verbose ? sentimentAnalysis : { sentiment_score: sentimentAnalysis.sentiment_score },
    score: scoreResult,
    scoreSummary,
    executiveSummary,
    metadata: {
      scrapedAt: googleData.scrapedAt,
      responseRate: googleData.responseRate,
      isOpen: googleData.isOpen,
    },
  };
}
