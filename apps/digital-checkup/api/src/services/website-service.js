/**
 * Website Analysis Service
 * Pure business logic for food business website analysis
 * Used by CLI, MCP stdio server, and MCP HTTP server
 */

import { scrapeWebsite, analyzeMenuContent } from '../scrapers/website.js';
import { analyzeMenuQuality, analyzeBrandIdentity, analyzeUX } from '../analyzers/claude-web.js';
import { analyzeSEO } from '../analyzers/seo.js';
import { detectCMS } from '../analyzers/cms.js';
import { analyzeCompliance, analyzeAnalytics } from '../analyzers/compliance.js';
import { calculateWebsiteScore, generateWebsiteSummary } from '../scorers/website-calculator.js';

/**
 * Analyze food business website with comprehensive scoring
 *
 * @param {Object} options - Analysis options
 * @param {string} options.url - Website URL (with or without https://)
 * @param {string} options.anthropicApiKey - Anthropic API key for AI analysis
 * @param {boolean} [options.verbose=false] - Return verbose AI analysis details
 * @param {Function} [options.progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} Complete website analysis results
 */
export async function analyzeWebsite(options) {
  const {
    url,
    anthropicApiKey,
    verbose = false,
    progressCallback = () => {},
  } = options;

  // Validate required parameters
  if (!url) {
    throw new Error('url is required');
  }
  if (!anthropicApiKey) {
    throw new Error('anthropicApiKey is required');
  }

  // Step 1: Scrape website
  progressCallback('Fetching website data...');
  const websiteData = await scrapeWebsite(url);

  // Step 2: Automatic analyses (no AI cost)
  progressCallback('Running automatic analyses...');
  const menuContent = analyzeMenuContent(websiteData.$);
  const seoAnalysis = analyzeSEO(websiteData);
  const cmsAnalysis = detectCMS(websiteData);
  const complianceAnalysis = analyzeCompliance(websiteData);
  const analyticsAnalysis = analyzeAnalytics(websiteData);

  // Step 3: AI analyses
  progressCallback('Analyzing menu quality...');
  const menuAnalysis = await analyzeMenuQuality(websiteData, menuContent, anthropicApiKey);

  progressCallback('Analyzing brand identity...');
  const brandAnalysis = await analyzeBrandIdentity(websiteData, anthropicApiKey);

  progressCallback('Analyzing UX & mobile...');
  const uxAnalysis = await analyzeUX(websiteData, anthropicApiKey);

  // Step 4: Calculate final score
  progressCallback('Calculating final score...');
  const analyses = {
    menuAnalysis,
    brandAnalysis,
    uxAnalysis,
    seoAnalysis,
    cmsAnalysis,
    complianceAnalysis,
    analyticsAnalysis,
  };
  const scoreResult = calculateWebsiteScore(analyses);
  const summary = generateWebsiteSummary(scoreResult, analyses);

  // Return complete results
  return {
    website: {
      url: websiteData.url,
      title: websiteData.metadata.title,
      description: websiteData.metadata.description,
      cms: cmsAnalysis.cms,
      cmsVersion: cmsAnalysis.version,
    },
    analyses: verbose ? analyses : {
      menuAnalysis: { score: menuAnalysis.score },
      brandAnalysis: { score: brandAnalysis.score },
      uxAnalysis: { score: uxAnalysis.score },
      seoAnalysis: { score: seoAnalysis.score },
      cmsAnalysis,
      complianceAnalysis,
      analyticsAnalysis,
    },
    score: scoreResult,
    summary,
  };
}
