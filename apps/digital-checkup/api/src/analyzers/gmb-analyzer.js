/**
 * Google My Business Completeness Analyzer
 *
 * Analyzes the completeness and quality of a Google My Business listing
 * to determine how well-optimized the business profile is for local discovery.
 */

/**
 * Analyzes GMB profile completeness and returns a score 0-100
 *
 * @param {Object} gmbData - Google My Business data from google-reviews scraper
 * @returns {Object} GMB analysis with score and breakdown
 */
export function analyzeGMBCompleteness(gmbData) {
  const scores = {
    basicInfo: analyzeBasicInfo(gmbData),
    photos: analyzePhotos(gmbData),
    hours: analyzeHours(gmbData),
    attributes: analyzeAttributes(gmbData),
    engagement: analyzeEngagement(gmbData)
  };

  // Weighted scoring (totals to 100)
  const weights = {
    basicInfo: 25,    // Name, address, phone, website, description
    photos: 25,       // Profile photo, cover, gallery
    hours: 15,        // Opening hours completeness
    attributes: 20,   // Business attributes (delivery, wifi, etc.)
    engagement: 15    // Posts, Q&A, owner responses
  };

  let finalScore = 0;
  const breakdown = {};

  for (const [metric, score] of Object.entries(scores)) {
    const weight = weights[metric];
    const contribution = (score.score * weight) / 100;
    finalScore += contribution;

    breakdown[metric] = {
      score: Math.round(score.score),
      weight,
      contribution: parseFloat(contribution.toFixed(2)),
      details: score.details
    };
  }

  // Identify strong and weak areas
  const strongAreas = [];
  const weakAreas = [];
  const recommendations = [];

  const labels = {
    basicInfo: 'Informazioni Base',
    photos: 'Galleria Foto',
    hours: 'Orari Apertura',
    attributes: 'Attributi Business',
    engagement: 'Engagement GMB'
  };

  for (const [metric, data] of Object.entries(breakdown)) {
    if (data.score >= 80) {
      strongAreas.push(labels[metric]);
    } else if (data.score < 60) {
      weakAreas.push(labels[metric]);
      // Add specific recommendations
      recommendations.push(...data.details.recommendations || []);
    }
  }

  return {
    finalScore: Math.round(finalScore),
    breakdown,
    strongAreas,
    weakAreas,
    recommendations: recommendations.slice(0, 5), // Top 5
    completenessPercentage: calculateCompletenessPercentage(breakdown)
  };
}

/**
 * Analyzes basic information completeness
 */
function analyzeBasicInfo(gmbData) {
  const checks = {
    hasName: !!gmbData.restaurantName,
    hasAddress: !!gmbData.address,
    hasWebsite: !!gmbData.website,
    hasPhone: !!gmbData.phoneNumber,
    hasDescription: !!gmbData.description,
    hasCategory: !!gmbData.primaryCategory,
    hasSecondaryCategories: (gmbData.secondaryCategories?.length || 0) > 0
  };

  const total = Object.keys(checks).length;
  const passed = Object.values(checks).filter(Boolean).length;
  const score = (passed / total) * 100;

  const recommendations = [];
  if (!checks.hasWebsite) recommendations.push('Aggiungi link sito web alla scheda GMB');
  if (!checks.hasDescription) recommendations.push('Aggiungi descrizione business completa (almeno 250 caratteri)');
  if (!checks.hasPhone) recommendations.push('Aggiungi numero di telefono per chiamate dirette');
  if (!checks.hasSecondaryCategories) recommendations.push('Aggiungi categorie secondarie (es: Pizzeria, Ristorante Italiano)');

  return {
    score,
    details: {
      checks,
      passed,
      total,
      recommendations
    }
  };
}

/**
 * Analyzes photo gallery quality and quantity
 *
 * NOTE: Google Places API returns max 10 photos in the photos[] array.
 * If photoCount = 10, it means the business likely has many more photos (good signal).
 * If photoCount < 10, it means the profile has few photos (needs improvement).
 */
function analyzePhotos(gmbData) {
  const photoCount = gmbData.photoCount || 0;
  const hasLogo = !!gmbData.hasLogo;
  const hasCover = !!gmbData.hasCoverPhoto;

  // Scoring criteria
  let score = 0;

  // Logo and cover (20 points each)
  if (hasLogo) score += 20;
  if (hasCover) score += 20;

  // Gallery photos (60 points - BINARY scoring)
  // API limit: max 10 photos returned
  // 10 photos = POSITIVE signal (full score)
  // < 10 photos = NEGATIVE signal (zero score)
  if (photoCount >= 10) {
    score += 60; // POSITIVE: profile has many photos
  } else {
    score += 0; // NEGATIVE: profile lacks photos
  }

  const recommendations = [];
  if (!hasLogo) recommendations.push('Aggiungi logo aziendale come foto profilo');
  if (!hasCover) recommendations.push('Aggiungi foto di copertina attraente');

  if (photoCount < 10) {
    recommendations.push(`IMPORTANTE: Aggiungi più foto al profilo GMB (attuale: ${photoCount}/10 visibili dall'API)`);
    recommendations.push('Target: almeno 10+ foto di qualità (piatti, ambiente, staff) per massimizzare visibilità');
  }

  return {
    score,
    details: {
      photoCount,
      hasLogo,
      hasCover,
      recommendations
    }
  };
}

/**
 * Analyzes opening hours completeness
 */
function analyzeHours(gmbData) {
  const hasHours = !!gmbData.hasOpeningHours;
  const hoursComplete = gmbData.hoursComplete || false; // All 7 days filled
  const hasSpecialHours = gmbData.hasSpecialHours || false; // Holidays, etc.

  let score = 0;

  if (hasHours) {
    score += 60; // Basic hours present
    if (hoursComplete) score += 30; // All days filled
    if (hasSpecialHours) score += 10; // Special hours defined
  }

  const recommendations = [];
  if (!hasHours) recommendations.push('URGENTE: Aggiungi orari di apertura (essenziale per discovery)');
  if (hasHours && !hoursComplete) recommendations.push('Completa orari per tutti i 7 giorni della settimana');
  if (!hasSpecialHours) recommendations.push('Aggiungi orari speciali per festività (Natale, Capodanno, etc.)');

  return {
    score,
    details: {
      hasHours,
      hoursComplete,
      hasSpecialHours,
      recommendations
    }
  };
}

/**
 * Analyzes business attributes (amenities, services)
 * Handles both array format (Google Places API) and object format (Outscraper)
 */
function analyzeAttributes(gmbData) {
  const rawAttributes = gmbData.attributes;

  // Normalize attributes to array format
  let attributes = [];
  let attributeCount = 0;

  if (Array.isArray(rawAttributes)) {
    // Google Places API format: ['delivery', 'takeout', ...]
    attributes = rawAttributes;
    attributeCount = attributes.length;
  } else if (rawAttributes && typeof rawAttributes === 'object') {
    // Outscraper format: could be object with keys or nested structure
    // Convert to array of strings for searching
    const flattenObject = (obj, prefix = '') => {
      let result = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}_${key}` : key;
        if (typeof value === 'object' && value !== null) {
          result = result.concat(flattenObject(value, fullKey));
        } else if (value === true || value) {
          result.push(fullKey.toLowerCase());
          if (typeof value === 'string') {
            result.push(value.toLowerCase());
          }
        }
      }
      return result;
    };
    attributes = flattenObject(rawAttributes);
    attributeCount = Object.keys(rawAttributes).length;
  }

  // Helper function to check if attribute exists (case-insensitive, partial match)
  const hasAttribute = (...keywords) => {
    return attributes.some(attr =>
      keywords.some(keyword =>
        attr.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  };

  // Key attributes to check
  const keyAttributes = {
    hasDelivery: hasAttribute('delivery', 'consegna', 'delivers'),
    hasTakeout: hasAttribute('takeout', 'asporto', 'takeaway'),
    hasDineIn: hasAttribute('dine_in', 'servizio_al_tavolo', 'dine-in', 'dining'),
    hasReservation: hasAttribute('reservable', 'prenotabile', 'reservation', 'prenotazione'),
    hasWifi: hasAttribute('free_wifi', 'wifi', 'wi-fi'),
    hasParking: hasAttribute('parking', 'parcheggio'),
    hasAccessibility: hasAttribute('wheelchair_accessible', 'accessibile', 'wheelchair', 'accessibility'),
    hasOutdoorSeating: hasAttribute('outdoor_seating', 'posti_esterni', 'outdoor', 'terrazza', 'dehors'),
    hasMenu: !!gmbData.hasMenu
  };

  const keyAttributesPassed = Object.values(keyAttributes).filter(Boolean).length;
  const keyAttributesTotal = Object.keys(keyAttributes).length;

  // Score based on key attributes (more important than total count)
  let score = (keyAttributesPassed / keyAttributesTotal) * 100;

  // Bonus for having many attributes
  if (attributeCount >= 15) score = Math.min(100, score + 10);
  else if (attributeCount >= 10) score = Math.min(100, score + 5);

  const recommendations = [];
  if (!keyAttributes.hasMenu) recommendations.push('IMPORTANTE: Aggiungi menu digitale alla scheda GMB');
  if (!keyAttributes.hasReservation) recommendations.push('Specifica se accetti prenotazioni (aumenta conversioni)');
  if (!keyAttributes.hasDelivery && !keyAttributes.hasTakeout) {
    recommendations.push('Indica servizi delivery/asporto se disponibili');
  }
  if (!keyAttributes.hasWifi) recommendations.push('Indica disponibilità WiFi gratuito');
  if (attributeCount < 10) recommendations.push('Compila più attributi possibile (target: 10-15 attributi)');

  return {
    score,
    details: {
      attributeCount,
      keyAttributes,
      keyAttributesPassed,
      keyAttributesTotal,
      recommendations
    }
  };
}

/**
 * Analyzes engagement features (posts, Q&A, responses)
 */
function analyzeEngagement(gmbData) {
  const hasRecentPosts = gmbData.hasRecentPosts || false; // Posts in last 30 days
  const postCount30d = gmbData.postCount30d || 0;
  const hasQA = gmbData.hasQA || false;
  const responseRate = gmbData.responseRate || 0; // From reviews

  let score = 0;

  // Posts (40 points)
  if (postCount30d >= 8) score += 40; // 2+ posts/week
  else if (postCount30d >= 4) score += 30; // 1 post/week
  else if (postCount30d >= 2) score += 20; // Some activity
  else if (postCount30d >= 1) score += 10; // Minimal activity

  // Q&A (20 points)
  if (hasQA) score += 20;

  // Response rate to reviews (40 points)
  score += (responseRate / 100) * 40;

  const recommendations = [];
  if (postCount30d === 0) {
    recommendations.push('IMPORTANTE: Pubblica post GMB regolarmente (offerte, eventi, piatti del giorno)');
  } else if (postCount30d < 4) {
    recommendations.push('Aumenta frequenza post GMB a 1+ a settimana');
  }
  if (responseRate < 50) {
    recommendations.push(`Aumenta response rate recensioni da ${responseRate}% a 60%+ (aumenta fiducia)`);
  }
  if (!hasQA) {
    recommendations.push('Aggiungi FAQ alla sezione Domande & Risposte');
  }

  return {
    score,
    details: {
      hasRecentPosts,
      postCount30d,
      hasQA,
      responseRate,
      recommendations
    }
  };
}

/**
 * Calculates overall completeness percentage
 */
function calculateCompletenessPercentage(breakdown) {
  // Average of all metric scores
  const scores = Object.values(breakdown).map(m => m.score);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avgScore);
}

/**
 * Get rating label for GMB score
 */
export function getGMBRatingLabel(score) {
  if (score >= 90) return 'Scheda Eccellente';
  if (score >= 80) return 'Scheda Ottima';
  if (score >= 70) return 'Scheda Buona';
  if (score >= 60) return 'Scheda Discreta';
  if (score >= 50) return 'Scheda Sufficiente';
  if (score >= 40) return 'Scheda Incompleta';
  return 'Scheda Critica';
}
