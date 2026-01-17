/**
 * Google My Business Analysis Service
 * Pure business logic for GMB completeness analysis (rule-based, no AI)
 * Used by CLI, MCP stdio server, and MCP HTTP server
 */

import { scrapeGoogleReviews } from '../scrapers/google-reviews.js';
import { analyzeGMBCompleteness } from '../analyzers/gmb-analyzer.js';

/**
 * Analyze Google My Business completeness
 *
 * @param {Object} options - Analysis options
 * @param {string} options.businessName - Restaurant name and location
 * @param {string} options.googleApiKey - Google Places API key
 * @param {string} [options.placeId] - Optional Google Place ID for precise identification
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} GMB completeness analysis results
 */
export async function analyzeGMB(options) {
  const {
    businessName,
    googleApiKey,
    placeId = null,
    progressCallback = () => {},
  } = options;

  // Validate required parameters
  if (!businessName) {
    throw new Error('businessName is required');
  }
  if (!googleApiKey) {
    throw new Error('googleApiKey is required');
  }

  // Step 1: Scrape Google Place data
  progressCallback('Fetching Google My Business data...');
  const placeData = await scrapeGoogleReviews(businessName, googleApiKey, placeId);

  // Step 2: Analyze GMB completeness (rule-based, no AI)
  progressCallback('Analyzing GMB completeness...');
  const completenessAnalysis = analyzeGMBCompleteness(placeData);

  // Return complete results
  return {
    business: {
      name: placeData.restaurantName,
      address: placeData.address,
      placeId: placeData.placeId,
      rating: placeData.rating,
      totalReviews: placeData.totalReviews,
      mapsUrl: placeData.mapsUrl,
      isOpen: placeData.isOpen,
      multipleResultsWarning: placeData.multipleResultsWarning,
    },
    completeness: completenessAnalysis,
    metadata: {
      scrapedAt: placeData.scrapedAt,
      photoCount: placeData.photoCount,
      hasWebsite: !!placeData.website,
      hasPhone: !!placeData.phoneNumber,
    },
  };
}
