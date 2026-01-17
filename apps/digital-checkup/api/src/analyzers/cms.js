/**
 * Detects CMS and tech stack
 * @param {Object} websiteData - Scraped website data
 * @returns {Object} CMS detection results with score
 */
export function detectCMS(websiteData) {
  const { $, headers, html } = websiteData;

  const detection = {
    cms: 'Unknown',
    confidence: 'low',
    version: null,
    technologies: [],
    indicators: []
  };

  const bodyText = html.toLowerCase();

  // WordPress detection
  if (bodyText.includes('wp-content') || bodyText.includes('wp-includes')) {
    detection.cms = 'WordPress';
    detection.confidence = 'high';
    detection.indicators.push('wp-content directory');

    // Try to detect version
    const versionMeta = $('meta[name="generator"]').attr('content');
    if (versionMeta && versionMeta.includes('WordPress')) {
      const versionMatch = versionMeta.match(/WordPress\s+(\d+\.\d+)/);
      if (versionMatch) {
        detection.version = versionMatch[1];
      }
    }
  }

  // Wix detection
  else if (bodyText.includes('wix.com') || bodyText.includes('_wix')) {
    detection.cms = 'Wix';
    detection.confidence = 'high';
    detection.indicators.push('Wix platform identifiers');
  }

  // Squarespace detection
  else if (bodyText.includes('squarespace') || $('body').attr('id') === 'collection') {
    detection.cms = 'Squarespace';
    detection.confidence = 'high';
    detection.indicators.push('Squarespace markers');
  }

  // Shopify detection
  else if (bodyText.includes('shopify') || bodyText.includes('cdn.shopify.com')) {
    detection.cms = 'Shopify';
    detection.confidence = 'high';
    detection.indicators.push('Shopify CDN');
  }

  // Webflow detection
  else if (bodyText.includes('webflow') || headers['server']?.includes('Webflow')) {
    detection.cms = 'Webflow';
    detection.confidence = 'high';
    detection.indicators.push('Webflow markers');
  }

  // Joomla detection
  else if (bodyText.includes('joomla') || $('meta[name="generator"]').attr('content')?.includes('Joomla')) {
    detection.cms = 'Joomla';
    detection.confidence = 'high';
    detection.indicators.push('Joomla generator tag');
  }

  // Drupal detection
  else if (bodyText.includes('drupal') || $('meta[name="generator"]').attr('content')?.includes('Drupal')) {
    detection.cms = 'Drupal';
    detection.confidence = 'high';
    detection.indicators.push('Drupal generator tag');
  }

  // Custom/Static detection
  else if ($('meta[name="generator"]').length === 0) {
    detection.cms = 'Custom/Static';
    detection.confidence = 'medium';
    detection.indicators.push('No CMS markers found');
  }

  // Detect additional technologies
  if (bodyText.includes('react')) {
    detection.technologies.push('React');
  }
  if (bodyText.includes('vue')) {
    detection.technologies.push('Vue.js');
  }
  if (bodyText.includes('angular')) {
    detection.technologies.push('Angular');
  }
  if (bodyText.includes('jquery')) {
    detection.technologies.push('jQuery');
  }
  if (bodyText.includes('bootstrap')) {
    detection.technologies.push('Bootstrap');
  }

  // Score based on CMS (modern CMS = higher score)
  const cmsScores = {
    'WordPress': 90,      // Most flexible, good for restaurants
    'Webflow': 95,       // Modern, professional
    'Squarespace': 85,   // Good templates, easy to use
    'Wix': 75,           // Easy but less professional
    'Shopify': 70,       // E-commerce focused (not ideal for pure restaurant)
    'Joomla': 65,        // Older CMS
    'Drupal': 70,        // Complex but powerful
    'Custom/Static': 80, // Can be good if well-made
    'Unknown': 50        // Uncertain
  };

  const score = cmsScores[detection.cms] || 50;

  return {
    score,
    cms: detection.cms,
    version: detection.version,
    confidence: detection.confidence,
    technologies: detection.technologies,
    indicators: detection.indicators,
    recommendation: generateCMSRecommendation(detection)
  };
}

/**
 * Generates CMS recommendation
 * @param {Object} detection - CMS detection data
 * @returns {string} Recommendation text
 */
function generateCMSRecommendation(detection) {
  switch (detection.cms) {
    case 'WordPress':
      return 'Ottima scelta. Considera plugin specifici per ristorazione (es. restaurant menu, booking).';
    case 'Wix':
      return 'Facile da usare ma limitato. Considera migrazione a WordPress/Webflow per più controllo.';
    case 'Webflow':
      return 'Eccellente per design professionale. Mantieni aggiornato.';
    case 'Squarespace':
      return 'Buona soluzione all-in-one. Utilizza template specifici per ristoranti.';
    case 'Custom/Static':
      return 'Verifica che sia facile aggiornare menu e orari senza developer.';
    case 'Unknown':
      return 'Impossibile determinare CMS. Considera piattaforma più standard per manutenibilità.';
    default:
      return 'CMS rilevato, verifica che supporti esigenze specifiche ristorazione.';
  }
}
