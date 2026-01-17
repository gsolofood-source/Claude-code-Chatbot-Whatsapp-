import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads weight configuration for website scoring
 * @returns {Object} Weight configuration
 */
function loadWeights() {
  const weightsPath = path.join(__dirname, '../../config/website-weights.json');
  const weightsData = fs.readFileSync(weightsPath, 'utf-8');
  return JSON.parse(weightsData);
}

/**
 * Calculates final weighted score for website
 * @param {Object} analyses - All analysis results
 * @returns {Object} Final score and breakdown
 */
export function calculateWebsiteScore(analyses) {
  const weights = loadWeights();

  const {
    menuAnalysis,
    brandAnalysis,
    uxAnalysis,
    seoAnalysis,
    cmsAnalysis,
    complianceAnalysis,
    analyticsAnalysis
  } = analyses;

  // Scores from different analyses
  const scores = {
    menu_offerta: menuAnalysis.score,
    brand_emozione: brandAnalysis.score,
    ux_mobile: uxAnalysis.score,
    seo_local: seoAnalysis.score,
    cms: cmsAnalysis.score,
    compliance: complianceAnalysis.score,
    social_proof: analyticsAnalysis.score,
    performance: 75 // Placeholder - will be replaced with Lighthouse data later
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
    ratings: generateRatings(scores)
  };
}

/**
 * Generates rating labels for each metric
 * @param {Object} scores - Individual scores
 * @returns {Object} Rating labels
 */
function generateRatings(scores) {
  const ratings = {};

  for (const [key, score] of Object.entries(scores)) {
    ratings[key] = getRatingLabel(score);
  }

  return ratings;
}

/**
 * Generates a rating label based on score
 * @param {number} score - Score 0-100
 * @returns {string} Rating label
 */
function getRatingLabel(score) {
  if (score >= 90) return 'Eccellente';
  if (score >= 75) return 'Ottimo';
  if (score >= 60) return 'Buono';
  if (score >= 45) return 'Sufficiente';
  if (score >= 30) return 'Scarso';
  return 'Critico';
}

/**
 * Generates executive summary with recommendations
 * @param {Object} result - Final score result
 * @param {Object} analyses - All analysis results
 * @returns {Object} Executive summary
 */
export function generateWebsiteSummary(result, analyses) {
  const { breakdown } = result;

  // Identify weak areas (score < 60)
  const weakAreas = Object.entries(breakdown)
    .filter(([_, data]) => data.score < 60)
    .map(([key, data]) => ({ metric: key, score: data.score }))
    .sort((a, b) => a.score - b.score);

  // Identify strong areas (score >= 75)
  const strongAreas = Object.entries(breakdown)
    .filter(([_, data]) => data.score >= 75)
    .map(([key, data]) => ({ metric: key, score: data.score }))
    .sort((a, b) => b.score - a.score);

  const labels = {
    menu_offerta: 'Menu & Offerta',
    brand_emozione: 'Brand & Emozione',
    ux_mobile: 'UX & Mobile',
    seo_local: 'SEO Local',
    performance: 'Performance Tecnica',
    cms: 'CMS',
    compliance: 'Compliance & Privacy',
    social_proof: 'Social Proof & Analytics'
  };

  // Generate recommendations
  const recommendations = [];

  // Menu recommendations
  if (breakdown.menu_offerta.score < 70) {
    const menuIssues = analyses.menuAnalysis.weaknesses || [];
    if (menuIssues.length > 0) {
      recommendations.push(...menuIssues.slice(0, 2));
    } else {
      recommendations.push('Migliorare chiarezza prezzi e descrizioni piatti');
    }
  }

  // SEO recommendations
  if (breakdown.seo_local.score < 70) {
    const seoIssues = analyses.seoAnalysis.issues || [];
    recommendations.push(...seoIssues.slice(0, 2));
  }

  // Compliance recommendations
  if (breakdown.compliance.score < 70) {
    const complianceIssues = analyses.complianceAnalysis.issues || [];
    if (complianceIssues.length > 0) {
      recommendations.push(complianceIssues[0]);
    }
  }

  // Analytics recommendations
  if (breakdown.social_proof.score < 60) {
    const analyticsRecs = analyses.analyticsAnalysis.recommendations || [];
    recommendations.push(...analyticsRecs.slice(0, 1));
  }

  // UX recommendations
  if (breakdown.ux_mobile.score < 70) {
    recommendations.push('Migliorare navigazione mobile e CTA visibilità');
  }

  // CMS recommendations
  if (breakdown.cms.score < 70 && analyses.cmsAnalysis.recommendation) {
    recommendations.push(analyses.cmsAnalysis.recommendation);
  }

  // Determine overall status
  let status;
  if (result.finalScore >= 85) status = 'Sito Eccellente';
  else if (result.finalScore >= 70) status = 'Sito Professionale';
  else if (result.finalScore >= 55) status = 'Buone Basi';
  else if (result.finalScore >= 40) status = 'Necessita Miglioramenti';
  else status = 'Rifacimento Consigliato';

  return {
    status,
    weakAreas: weakAreas.map(a => labels[a.metric]),
    strongAreas: strongAreas.map(a => labels[a.metric]),
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    riskLevel: analyses.complianceAnalysis.risk
  };
}
