/**
 * Global Digital Presence Analysis Service
 * Orchestrates all analysis pillars (Reputation, GMB, Instagram, Website)
 * Used by CLI, MCP stdio server, and MCP HTTP server
 *
 * RESILIENT MODE: Continues analysis even if some pillars fail
 * Returns partial results with clear error reporting for each pillar
 */

import { analyzeReputation } from './reputation-service.js';
import { analyzeGMB } from './gmb-service.js';
import { analyzeInstagram } from './instagram-service.js';
import { analyzeWebsite } from './website-service.js';
import { calculateGlobalScore, generateGlobalSummary } from '../scorers/global-calculator.js';

/**
 * Comprehensive digital presence analysis across all channels
 * Resilient: continues even if some pillars fail
 *
 * @param {Object} options - Analysis options
 * @param {string} [options.businessName] - Business name and location (for Google analysis)
 * @param {string} options.googleApiKey - Google Places API key
 * @param {string} options.anthropicApiKey - Anthropic API key for AI analysis
 * @param {string} [options.placeId] - Optional Google Place ID for precise identification
 * @param {string} [options.instagramUsername] - Optional Instagram username to analyze
 * @param {string} [options.websiteUrl] - Optional website URL to analyze
 * @param {boolean} [options.verbose=false] - Return verbose AI analysis details
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} Complete global analysis results with error tracking
 */
export async function analyzeGlobal(options) {
  const {
    businessName = null,
    googleApiKey,
    anthropicApiKey,
    placeId = null,
    instagramUsername = null,
    websiteUrl = null,
    verbose = false,
    progressCallback = () => {},
  } = options;

  // Validate API keys
  // googleApiKey is only required if businessName is provided (for GMB/Reputation analysis)
  if (businessName && !googleApiKey) {
    throw new Error('googleApiKey is required for Google Business analysis');
  }
  if (!anthropicApiKey) {
    throw new Error('anthropicApiKey is required');
  }

  // Validate that at least one input is provided
  if (!businessName && !instagramUsername && !websiteUrl) {
    throw new Error('At least one of businessName, instagramUsername, or websiteUrl must be provided');
  }

  const results = {};
  const scores = {};
  const errors = {};  // Track errors for each pillar

  // ========== PILLAR 1: REPUTATION (NOW OPTIONAL) ==========
  if (businessName) {
    progressCallback('Analyzing Reputation...');

    try {
      const reputationData = await analyzeReputation({
        businessName,
        googleApiKey,
        anthropicApiKey,
        placeId,
        verbose,
        progressCallback: (msg) => progressCallback(`Reputation: ${msg}`),
      });

      results.reputation = reputationData;
      scores.reputation = reputationData.score.finalScore;
    } catch (error) {
      console.warn(`[WARN] Reputation analysis failed: ${error.message}`);
      progressCallback(`Reputation analysis failed: ${error.message}`);
      scores.reputation = null;
      errors.reputation = error.message;
    }
  } else {
    scores.reputation = null;
    errors.reputation = 'businessName not provided';
  }

  // ========== PILLAR 2: GOOGLE MY BUSINESS (NOW OPTIONAL) ==========
  if (businessName) {
    progressCallback('Analyzing Google My Business...');

    try {
      const gmbData = await analyzeGMB({
        businessName,
        googleApiKey,
        placeId,
        progressCallback: (msg) => progressCallback(`GMB: ${msg}`),
      });

      results.googleBusiness = gmbData;
      scores.googleBusiness = gmbData.completeness.finalScore;
    } catch (error) {
      console.warn(`[WARN] GMB analysis failed: ${error.message}`);
      progressCallback(`GMB analysis failed: ${error.message}`);
      scores.googleBusiness = null;
      errors.googleBusiness = error.message;
    }
  } else {
    scores.googleBusiness = null;
    errors.googleBusiness = 'businessName not provided';
  }

  // ========== PILLAR 3: INSTAGRAM (OPTIONAL) ==========
  if (instagramUsername) {
    progressCallback('Analyzing Instagram...');

    try {
      const instagramData = await analyzeInstagram({
        username: instagramUsername,
        anthropicApiKey,
        verbose,
        progressCallback: (msg) => progressCallback(`Instagram: ${msg}`),
      });

      results.instagram = instagramData;
      scores.instagram = instagramData.score.finalScore;
    } catch (error) {
      console.warn(`[WARN] Instagram analysis failed for @${instagramUsername}: ${error.message}`);
      progressCallback(`Instagram analysis failed: ${error.message}`);
      scores.instagram = null;
      errors.instagram = error.message;
    }
  } else {
    scores.instagram = null;
    // Not an error if not provided - just not requested
  }

  // ========== PILLAR 4: WEBSITE (OPTIONAL) ==========
  if (websiteUrl) {
    progressCallback('Analyzing Website...');

    try {
      const websiteData = await analyzeWebsite({
        url: websiteUrl,
        anthropicApiKey,
        verbose,
        progressCallback: (msg) => progressCallback(`Website: ${msg}`),
      });

      results.website = websiteData;
      scores.website = websiteData.score.finalScore;
    } catch (error) {
      console.warn(`[WARN] Website analysis failed for ${websiteUrl}: ${error.message}`);
      progressCallback(`Website analysis failed: ${error.message}`);
      scores.website = null;
      errors.website = error.message;
    }
  } else {
    scores.website = null;
    // Not an error if not provided - just not requested
  }

  // ========== CHECK IF AT LEAST ONE PILLAR SUCCEEDED ==========
  const successfulPillars = Object.keys(scores).filter(k => scores[k] !== null);

  if (successfulPillars.length === 0) {
    // All pillars failed - return error summary
    throw new Error(
      `All analyses failed. Errors: ${Object.entries(errors)
        .map(([pillar, err]) => `${pillar}: ${err}`)
        .join('; ')}`
    );
  }

  // ========== CALCULATE GLOBAL SCORE ==========
  progressCallback('Calculating global score...');

  const globalScore = calculateGlobalScore(scores);

  // Calculate global summary
  const pillarResults = {
    reputation: results.reputation || null,
    googleBusiness: results.googleBusiness || null,
    instagram: results.instagram || null,
    website: results.website || null,
  };
  const globalSummary = generateGlobalSummary(globalScore, pillarResults);

  // Build business info from available sources
  const business = buildBusinessInfo(results, businessName, instagramUsername, websiteUrl);

  // Build pillars object with error tracking
  const pillars = {};

  if (scores.reputation !== null) {
    pillars.reputation = {
      score: scores.reputation,
      weight: globalScore.breakdown.reputation.weight,
      status: 'success',
      data: verbose ? results.reputation : {
        score: results.reputation.score,
        trendAnalysis: results.reputation.trendAnalysis,
      },
    };
  } else if (businessName) {
    pillars.reputation = {
      score: null,
      weight: 0,
      status: 'error',
      error: errors.reputation,
      data: null,
    };
  }

  if (scores.googleBusiness !== null) {
    pillars.googleBusiness = {
      score: scores.googleBusiness,
      weight: globalScore.breakdown.google_business.weight,
      status: 'success',
      data: verbose ? results.googleBusiness : {
        completeness: results.googleBusiness.completeness,
      },
    };
  } else if (businessName) {
    pillars.googleBusiness = {
      score: null,
      weight: 0,
      status: 'error',
      error: errors.googleBusiness,
      data: null,
    };
  }

  if (scores.instagram !== null) {
    pillars.instagram = {
      score: scores.instagram,
      weight: globalScore.breakdown.instagram.weight,
      status: 'success',
      data: verbose ? results.instagram : {
        score: results.instagram.score,
        profile: results.instagram.profile,
      },
    };
  } else if (instagramUsername) {
    pillars.instagram = {
      score: null,
      weight: 0,
      status: 'error',
      error: errors.instagram,
      data: null,
    };
  }

  if (scores.website !== null) {
    pillars.website = {
      score: scores.website,
      weight: globalScore.breakdown.website.weight,
      status: 'success',
      data: verbose ? results.website : {
        score: results.website.score,
        website: results.website.website,
      },
    };
  } else if (websiteUrl) {
    pillars.website = {
      score: null,
      weight: 0,
      status: 'error',
      error: errors.website,
      data: null,
    };
  }

  // Count requested vs successful pillars
  const requestedPillars = [
    businessName ? 'reputation' : null,
    businessName ? 'googleBusiness' : null,
    instagramUsername ? 'instagram' : null,
    websiteUrl ? 'website' : null,
  ].filter(Boolean);

  const failedPillars = Object.keys(errors);
  const hasPartialFailure = failedPillars.length > 0 && successfulPillars.length > 0;

  // Return complete results
  return {
    business,
    pillars,
    globalScore: globalScore.finalScore,
    riskLevel: globalSummary.riskLevel,
    summary: {
      ...globalSummary,
      // Add error information to summary if there were failures
      ...(hasPartialFailure && {
        partialAnalysis: true,
        failedPillars: failedPillars.map(p => ({
          pillar: p,
          error: errors[p],
        })),
      }),
    },
    breakdown: globalScore.breakdown,
    errors: Object.keys(errors).length > 0 ? errors : null,
    metadata: {
      requestedPillars: requestedPillars.length,
      analyzedPillars: successfulPillars.length,
      failedPillars: failedPillars.length,
      totalPillars: 4,
      completeness: globalScore.completeness,
      partialSuccess: hasPartialFailure,
    },
  };
}

/**
 * Build business info from available sources
 * Uses reputation data if available, falls back to other sources
 */
function buildBusinessInfo(results, businessName, instagramUsername, websiteUrl) {
  // If reputation data is available, use it as primary source
  if (results.reputation?.business) {
    return {
      name: results.reputation.business.name,
      address: results.reputation.business.address,
      rating: results.reputation.business.rating,
      totalReviews: results.reputation.business.totalReviews,
      source: 'google',
    };
  }

  // If GMB data is available, use it
  if (results.googleBusiness?.business) {
    return {
      name: results.googleBusiness.business.name,
      address: results.googleBusiness.business.address,
      rating: results.googleBusiness.business.rating,
      totalReviews: results.googleBusiness.business.totalReviews,
      source: 'gmb',
    };
  }

  // If Instagram data is available, use profile info
  if (results.instagram?.profile) {
    return {
      name: results.instagram.profile.fullName || results.instagram.profile.username,
      instagramUsername: results.instagram.profile.username,
      followers: results.instagram.profile.followers,
      source: 'instagram',
    };
  }

  // If website data is available, use it
  if (results.website?.website) {
    return {
      name: results.website.website.title || websiteUrl,
      websiteUrl: results.website.website.url,
      source: 'website',
    };
  }

  // Fallback: use input parameters
  return {
    name: businessName || instagramUsername || websiteUrl || 'Unknown',
    source: 'input',
    note: 'Business info not available from analysis',
  };
}
