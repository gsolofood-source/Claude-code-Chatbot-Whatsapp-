/**
 * Instagram Analysis Service
 * Pure business logic for Instagram profile analysis
 * Used by CLI, MCP stdio server, and MCP HTTP server
 */

import { scrapeProfile, calculateBasicMetrics } from '../scrapers/instagram.js';
import { analyzeCopywriting, analyzeVisualIdentity, analyzeOriginality, generateExecutiveSummary } from '../analyzers/claude.js';
import { calculateFinalScore } from '../scorers/calculator.js';

/**
 * Analyze Instagram profile with AI (full analysis)
 *
 * @param {Object} options - Analysis options
 * @param {string} options.username - Instagram username (without @)
 * @param {string} options.anthropicApiKey - Anthropic API key for AI analysis
 * @param {boolean} [options.verbose=false] - Return verbose AI analysis details
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} Complete Instagram analysis results
 */
export async function analyzeInstagram(options) {
  const {
    username,
    anthropicApiKey,
    verbose = false,
    progressCallback = () => {},
  } = options;

  // Validate required parameters
  if (!username) {
    throw new Error('username is required');
  }
  if (!anthropicApiKey) {
    throw new Error('anthropicApiKey is required');
  }

  // Step 1: Scrape profile
  progressCallback('Scraping profile data...');
  const profileData = await scrapeProfile(username);

  // Step 2: Calculate basic metrics
  progressCallback('Calculating engagement metrics...');
  const basicMetrics = calculateBasicMetrics(profileData);
  basicMetrics.followers = profileData.followers;

  // Step 3: AI Analysis
  progressCallback('Analyzing copywriting quality...');
  const copywriting = await analyzeCopywriting(profileData.posts, anthropicApiKey);

  progressCallback('Analyzing visual identity...');
  const visualIdentity = await analyzeVisualIdentity(profileData, anthropicApiKey);

  progressCallback('Analyzing originality...');
  const originality = await analyzeOriginality(profileData, anthropicApiKey);

  // Step 4: Calculate final score
  progressCallback('Calculating final score...');
  const aiAnalysis = { copywriting, visualIdentity, originality };
  const scoreResult = calculateFinalScore(basicMetrics, aiAnalysis);

  // Step 5: Generate executive summary
  progressCallback('Generating executive summary...');
  const executiveSummary = await generateExecutiveSummary(scoreResult, profileData, aiAnalysis, anthropicApiKey);

  // Return complete results
  return {
    profile: {
      username: profileData.username,
      fullName: profileData.fullName,
      followers: profileData.followers,
      following: profileData.following,
      postsCount: profileData.postsCount,
      bio: profileData.bio,
      isVerified: profileData.isVerified,
      isBusinessAccount: profileData.isBusinessAccount,
      category: profileData.category,
    },
    metrics: basicMetrics,
    aiAnalysis: verbose ? aiAnalysis : {
      copywriting: { score: copywriting.score },
      visualIdentity: { score: visualIdentity.score },
      originality: { score: originality.score },
    },
    score: scoreResult,
    executiveSummary,
    posts: profileData.posts.slice(0, 12), // Last 12 posts analyzed
  };
}

/**
 * Inspect Instagram profile without AI (quick check)
 *
 * @param {Object} options - Inspection options
 * @param {string} options.username - Instagram username (without @)
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} Basic Instagram profile stats without AI analysis
 */
export async function inspectInstagram(options) {
  const {
    username,
    progressCallback = () => {},
  } = options;

  // Validate required parameters
  if (!username) {
    throw new Error('username is required');
  }

  // Step 1: Scrape profile
  progressCallback('Scraping profile data...');
  const profileData = await scrapeProfile(username);

  // Step 2: Calculate basic metrics
  progressCallback('Calculating engagement metrics...');
  const basicMetrics = calculateBasicMetrics(profileData);

  // Return profile data and metrics (no AI analysis, no scoring)
  return {
    profile: {
      username: profileData.username,
      fullName: profileData.fullName,
      followers: profileData.followers,
      following: profileData.following,
      postsCount: profileData.postsCount,
      bio: profileData.bio,
      isVerified: profileData.isVerified,
      isBusinessAccount: profileData.isBusinessAccount,
      category: profileData.category,
    },
    metrics: {
      ...basicMetrics,
      followers: profileData.followers,
    },
    posts: profileData.posts.map(p => ({
      caption: p.caption,
      timestamp: p.timestamp,
      likes: p.likes,
      comments: p.comments,
      engagement: p.engagement,
    })),
  };
}
