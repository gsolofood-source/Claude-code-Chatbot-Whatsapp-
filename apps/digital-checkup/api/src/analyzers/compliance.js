/**
 * Checks GDPR compliance and privacy signals
 * @param {Object} websiteData - Scraped website data
 * @returns {Object} Compliance analysis with score
 */
export function analyzeCompliance(websiteData) {
  const { $, html } = websiteData;

  const bodyText = html.toLowerCase();

  const signals = {
    hasCookieBanner: false,
    hasPrivacyPolicy: false,
    hasCookiePolicy: false,
    hasTermsOfService: false,
    hasConsentManagement: false,
    hasGDPRMention: false,
    hasAnalyticsTracking: false
  };

  // Check for cookie banner/notice
  const cookieBannerKeywords = ['cookie', 'cookies', 'accetto', 'accetta', 'consenso'];
  const cookieBannerElements = $('div[class*="cookie"], div[id*="cookie"], div[class*="consent"], div[id*="consent"]');
  signals.hasCookieBanner = cookieBannerElements.length > 0 ||
                           cookieBannerKeywords.some(keyword => bodyText.includes(keyword));

  // Check for Privacy Policy link
  const privacyLinks = $('a').filter((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    return text.includes('privacy') || text.includes('privata') ||
           href.includes('privacy') || href.includes('privata');
  });
  signals.hasPrivacyPolicy = privacyLinks.length > 0;

  // Check for Cookie Policy link
  const cookiePolicyLinks = $('a').filter((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    return text.includes('cookie policy') || href.includes('cookie-policy');
  });
  signals.hasCookiePolicy = cookiePolicyLinks.length > 0;

  // Check for Terms of Service
  const tosLinks = $('a').filter((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    return text.includes('termini') || text.includes('condizioni') ||
           text.includes('terms') || href.includes('terms');
  });
  signals.hasTermsOfService = tosLinks.length > 0;

  // Check for consent management platforms
  const consentPlatforms = [
    'iubenda',
    'cookiebot',
    'onetrust',
    'quantcast',
    'cookiepro',
    'usercentrics'
  ];
  signals.hasConsentManagement = consentPlatforms.some(platform =>
    bodyText.includes(platform)
  );

  // Check for GDPR mention
  signals.hasGDPRMention = bodyText.includes('gdpr') ||
                          bodyText.includes('regolamento generale');

  // Check for analytics tracking
  signals.hasAnalyticsTracking = bodyText.includes('google-analytics') ||
                                bodyText.includes('gtag') ||
                                bodyText.includes('gtm') ||
                                bodyText.includes('facebook pixel') ||
                                bodyText.includes('_ga');

  // Calculate score (0-100)
  let score = 0;

  if (signals.hasCookieBanner) score += 35;
  if (signals.hasPrivacyPolicy) score += 30;
  if (signals.hasCookiePolicy) score += 15;
  if (signals.hasConsentManagement) score += 10;
  if (signals.hasTermsOfService) score += 5;
  if (signals.hasGDPRMention) score += 5;

  return {
    score: Math.min(100, score),
    signals,
    issues: generateComplianceIssues(signals),
    risk: calculateRiskLevel(signals)
  };
}

/**
 * Generates compliance issues
 * @param {Object} signals - Compliance signals
 * @returns {Array} List of issues
 */
function generateComplianceIssues(signals) {
  const issues = [];

  if (!signals.hasCookieBanner && signals.hasAnalyticsTracking) {
    issues.push('CRITICAL: Using analytics without cookie consent banner (GDPR violation)');
  }

  if (!signals.hasPrivacyPolicy) {
    issues.push('CRITICAL: Missing Privacy Policy (required by law)');
  }

  if (!signals.hasCookiePolicy && signals.hasAnalyticsTracking) {
    issues.push('Missing Cookie Policy');
  }

  if (!signals.hasConsentManagement && signals.hasAnalyticsTracking) {
    issues.push('No consent management platform detected (consider Iubenda, CookieBot)');
  }

  if (signals.hasCookieBanner && !signals.hasConsentManagement) {
    issues.push('Cookie banner present but no proper consent management');
  }

  return issues;
}

/**
 * Calculates compliance risk level
 * @param {Object} signals - Compliance signals
 * @returns {string} Risk level
 */
function calculateRiskLevel(signals) {
  if (!signals.hasPrivacyPolicy) {
    return 'HIGH';
  }
  if (signals.hasAnalyticsTracking && !signals.hasCookieBanner) {
    return 'HIGH';
  }
  if (!signals.hasCookiePolicy && signals.hasAnalyticsTracking) {
    return 'MEDIUM';
  }
  if (signals.hasPrivacyPolicy && signals.hasCookieBanner) {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Analyzes presence of analytics and social proof
 * @param {Object} websiteData - Scraped website data
 * @returns {Object} Analytics analysis
 */
export function analyzeAnalytics(websiteData) {
  const { $, html } = websiteData;
  const bodyText = html.toLowerCase();

  const signals = {
    hasGoogleAnalytics: bodyText.includes('google-analytics') || bodyText.includes('gtag'),
    hasGTM: bodyText.includes('googletagmanager'),
    hasFacebookPixel: bodyText.includes('facebook') && bodyText.includes('pixel'),
    hasHotjar: bodyText.includes('hotjar'),
    hasGoogleReviews: $('iframe[src*="google.com/maps"]').length > 0,
    hasTestimonials: false,
    hasTrustBadges: false
  };

  // Check for testimonials/reviews section
  const testimonialsKeywords = ['recensioni', 'testimonianze', 'reviews', 'testimonials'];
  signals.hasTestimonials = testimonialsKeywords.some(keyword =>
    $('h2, h3, div[class*="' + keyword + '"], section[class*="' + keyword + '"]').length > 0
  );

  // Check for trust badges
  const trustBadges = ['tripadvisor', 'michelin', 'gambero rosso', 'trustpilot'];
  signals.hasTrustBadges = trustBadges.some(badge =>
    bodyText.includes(badge) || $('img[alt*="' + badge + '"]').length > 0
  );

  // Calculate score
  let score = 0;
  if (signals.hasGoogleAnalytics || signals.hasGTM) score += 20;
  if (signals.hasGoogleReviews) score += 30;
  if (signals.hasTestimonials) score += 25;
  if (signals.hasTrustBadges) score += 25;

  return {
    score: Math.min(100, score),
    signals,
    recommendations: generateAnalyticsRecommendations(signals)
  };
}

/**
 * Generates analytics recommendations
 * @param {Object} signals - Analytics signals
 * @returns {Array} Recommendations
 */
function generateAnalyticsRecommendations(signals) {
  const recs = [];

  if (!signals.hasGoogleAnalytics && !signals.hasGTM) {
    recs.push('Installa Google Analytics per monitorare traffico e conversioni');
  }

  if (!signals.hasGoogleReviews) {
    recs.push('Aggiungi widget Google Reviews/Maps per social proof');
  }

  if (!signals.hasTestimonials) {
    recs.push('Crea sezione testimonial clienti soddisfatti');
  }

  if (!signals.hasTrustBadges) {
    recs.push('Aggiungi badge riconoscimenti (Michelin, TripAdvisor, etc)');
  }

  if (!signals.hasHotjar) {
    recs.push('Considera Hotjar per heatmaps e user behavior analysis');
  }

  return recs;
}
