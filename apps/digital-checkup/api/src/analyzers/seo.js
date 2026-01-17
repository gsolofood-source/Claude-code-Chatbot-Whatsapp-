/**
 * Analyzes SEO and local business signals
 * @param {Object} websiteData - Scraped website data
 * @returns {Object} SEO analysis with score
 */
export function analyzeSEO(websiteData) {
  const { $, metadata, schemas, url } = websiteData;

  const signals = {
    // Basic SEO
    hasTitle: !!metadata.title,
    titleLength: metadata.title.length,
    hasDescription: !!metadata.description,
    descriptionLength: metadata.description.length,
    hasOgTags: !!(metadata.ogTitle && metadata.ogImage),

    // Local business signals
    hasAddress: false,
    hasPhone: false,
    hasGoogleMapsEmbed: false,
    hasLocalSchema: false,
    hasReviewsSchema: false,

    // Schema.org structured data
    schemaTypes: [],

    // Meta tags
    hasViewport: $('meta[name="viewport"]').length > 0,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    hasRobots: $('meta[name="robots"]').length > 0,

    // Language
    hasLangAttribute: $('html[lang]').length > 0
  };

  // Check for address in text
  const bodyText = $('body').text();
  const addressPattern = /via\s+[a-zA-Z\s]+\d+|piazza\s+[a-zA-Z\s]+\d+|corso\s+[a-zA-Z\s]+\d+/i;
  signals.hasAddress = addressPattern.test(bodyText) ||
                      $('address').length > 0 ||
                      bodyText.toLowerCase().includes('indirizzo');

  // Check for phone number
  const phonePattern = /\+?\d{2,4}[\s\-\.]?\d{3,4}[\s\-\.]?\d{3,4}/;
  signals.hasPhone = phonePattern.test(bodyText) ||
                    $('a[href^="tel:"]').length > 0;

  // Check for Google Maps embed
  signals.hasGoogleMapsEmbed = $('iframe[src*="google.com/maps"]').length > 0 ||
                              $('iframe[src*="goo.gl"]').length > 0;

  // Analyze Schema.org structured data
  schemas.forEach(schema => {
    const type = schema['@type'] || (Array.isArray(schema['@graph']) ? 'Graph' : 'Unknown');
    signals.schemaTypes.push(type);

    // Check for LocalBusiness or Restaurant schema
    if (type === 'LocalBusiness' || type === 'Restaurant' || type === 'FoodEstablishment') {
      signals.hasLocalSchema = true;
    }

    // Check for Review schema
    if (type === 'Review' || schema.review || schema.aggregateRating) {
      signals.hasReviewsSchema = true;
    }
  });

  // Calculate score (0-100)
  let score = 0;

  // Basic SEO (40 points)
  if (signals.hasTitle && signals.titleLength >= 30 && signals.titleLength <= 60) score += 10;
  else if (signals.hasTitle) score += 5;

  if (signals.hasDescription && signals.descriptionLength >= 120 && signals.descriptionLength <= 160) score += 10;
  else if (signals.hasDescription) score += 5;

  if (signals.hasOgTags) score += 10;
  if (signals.hasViewport) score += 5;
  if (signals.hasCanonical) score += 5;

  // Local SEO (60 points)
  if (signals.hasAddress) score += 15;
  if (signals.hasPhone) score += 10;
  if (signals.hasGoogleMapsEmbed) score += 15;
  if (signals.hasLocalSchema) score += 15;
  if (signals.hasReviewsSchema) score += 5;

  return {
    score: Math.min(100, score),
    signals,
    issues: generateSEOIssues(signals)
  };
}

/**
 * Generates list of SEO issues to fix
 * @param {Object} signals - SEO signals
 * @returns {Array} List of issues
 */
function generateSEOIssues(signals) {
  const issues = [];

  if (!signals.hasTitle) {
    issues.push('Missing page title');
  } else if (signals.titleLength < 30 || signals.titleLength > 60) {
    issues.push(`Title length not optimal (${signals.titleLength} chars, should be 30-60)`);
  }

  if (!signals.hasDescription) {
    issues.push('Missing meta description');
  } else if (signals.descriptionLength < 120 || signals.descriptionLength > 160) {
    issues.push(`Meta description length not optimal (${signals.descriptionLength} chars, should be 120-160)`);
  }

  if (!signals.hasOgTags) {
    issues.push('Missing Open Graph tags (poor social sharing)');
  }

  if (!signals.hasAddress) {
    issues.push('No physical address found (critical for local SEO)');
  }

  if (!signals.hasPhone) {
    issues.push('No phone number found');
  }

  if (!signals.hasGoogleMapsEmbed) {
    issues.push('No Google Maps embed (helps local discovery)');
  }

  if (!signals.hasLocalSchema) {
    issues.push('Missing LocalBusiness/Restaurant schema.org markup');
  }

  if (!signals.hasViewport) {
    issues.push('Missing viewport meta tag (mobile SEO)');
  }

  return issues;
}
