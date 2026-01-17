/**
 * Trend Analyzer - Calculate temporal trends in reviews
 *
 * Analyzes how ratings and sentiment change over time to identify
 * if a restaurant is improving, declining, or stable.
 */

/**
 * Calculate comprehensive trend analysis from reviews
 *
 * @param {Array} reviews - Array of review objects with rating, date, timestamp
 * @param {number} overallRating - Current average rating from platform
 * @returns {Object} Trend analysis with direction, momentum, and velocity
 */
export function analyzeTrend(reviews, overallRating) {
  if (!reviews || reviews.length === 0) {
    return {
      overall_direction: 'UNKNOWN',
      momentum: 0,
      timeframes: {},
      velocity: {},
      confidence: 'LOW'
    };
  }

  // Sort reviews by date (newest first)
  const sortedReviews = [...reviews].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  // Calculate timeframes
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const timeframes = {
    last_30_days: calculateTimeframeMetrics(sortedReviews, now, 30 * day),
    last_90_days: calculateTimeframeMetrics(sortedReviews, now, 90 * day),
    last_6_months: calculateTimeframeMetrics(sortedReviews, now, 180 * day),
    last_year: calculateTimeframeMetrics(sortedReviews, now, 365 * day)
  };

  // Calculate velocity (rate of change)
  const velocity = {
    rating_change_30d: calculateRatingChange(timeframes.last_30_days.avg_rating, overallRating),
    rating_change_90d: calculateRatingChange(timeframes.last_90_days.avg_rating, overallRating),
    rating_change_6m: calculateRatingChange(timeframes.last_6_months.avg_rating, overallRating),
    review_velocity: calculateReviewVelocity(timeframes.last_30_days.review_count)
  };

  // Determine overall direction
  const direction = determineDirection(velocity);

  // Calculate momentum (speed of change)
  const momentum = calculateMomentum(velocity);

  // Confidence level based on data availability
  const confidence = calculateConfidence(timeframes);

  return {
    overall_direction: direction,
    momentum,
    timeframes,
    velocity,
    confidence
  };
}

/**
 * Calculate metrics for a specific timeframe
 */
function calculateTimeframeMetrics(reviews, now, timespan) {
  const cutoffDate = now - timespan;

  const relevantReviews = reviews.filter(review => {
    const reviewDate = new Date(review.date).getTime();
    return reviewDate >= cutoffDate;
  });

  const count = relevantReviews.length;
  const avgRating = count > 0
    ? parseFloat((relevantReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(2))
    : 0;

  return {
    avg_rating: avgRating,
    review_count: count,
    oldest_review_date: count > 0 ? relevantReviews[relevantReviews.length - 1].date : null,
    newest_review_date: count > 0 ? relevantReviews[0].date : null
  };
}

/**
 * Calculate rating change between timeframe and overall
 */
function calculateRatingChange(timeframeRating, overallRating) {
  if (timeframeRating === 0) return 0;
  return parseFloat((timeframeRating - overallRating).toFixed(2));
}

/**
 * Calculate review velocity (reviews per month)
 */
function calculateReviewVelocity(reviewsLast30Days) {
  return reviewsLast30Days; // Already monthly
}

/**
 * Determine overall trend direction
 */
function determineDirection(velocity) {
  const { rating_change_30d, rating_change_90d } = velocity;

  // Strong signals
  if (rating_change_30d > 0.15 && rating_change_90d > 0.1) {
    return 'IMPROVING';
  }
  if (rating_change_30d < -0.15 && rating_change_90d < -0.1) {
    return 'DECLINING';
  }

  // Moderate signals (recent trend more important)
  if (rating_change_30d > 0.05) {
    return 'IMPROVING';
  }
  if (rating_change_30d < -0.05) {
    return 'DECLINING';
  }

  // Stable
  return 'STABLE';
}

/**
 * Calculate momentum (speed of change)
 * Returns a value between -1 (rapid decline) and +1 (rapid improvement)
 */
function calculateMomentum(velocity) {
  const { rating_change_30d, rating_change_90d } = velocity;

  // Weight recent changes more heavily
  const momentum = (rating_change_30d * 0.7) + (rating_change_90d * 0.3);

  // Clamp between -1 and 1
  return parseFloat(Math.max(-1, Math.min(1, momentum)).toFixed(2));
}

/**
 * Calculate confidence level based on data availability
 */
function calculateConfidence(timeframes) {
  const { last_30_days, last_90_days } = timeframes;

  // Need minimum reviews for confidence
  if (last_30_days.review_count >= 5 && last_90_days.review_count >= 15) {
    return 'HIGH';
  }
  if (last_30_days.review_count >= 2 && last_90_days.review_count >= 8) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Generate human-readable trend description
 */
export function generateTrendDescription(trendAnalysis) {
  const { overall_direction, momentum, timeframes, confidence } = trendAnalysis;

  let description = '';
  let emoji = '→';

  switch (overall_direction) {
    case 'IMPROVING':
      emoji = '↗️';
      if (Math.abs(momentum) > 0.2) {
        description = 'MIGLIORAMENTO RAPIDO';
      } else if (Math.abs(momentum) > 0.1) {
        description = 'MIGLIORAMENTO COSTANTE';
      } else {
        description = 'LEGGERO MIGLIORAMENTO';
      }
      break;

    case 'DECLINING':
      emoji = '↘️';
      if (Math.abs(momentum) > 0.2) {
        description = 'PEGGIORAMENTO RAPIDO';
      } else if (Math.abs(momentum) > 0.1) {
        description = 'PEGGIORAMENTO COSTANTE';
      } else {
        description = 'LEGGERO PEGGIORAMENTO';
      }
      break;

    case 'STABLE':
      emoji = '→';
      description = 'STABILE';
      break;

    default:
      emoji = '❓';
      description = 'DATI INSUFFICIENTI';
  }

  // Add confidence indicator
  if (confidence === 'LOW') {
    description += ' (dati limitati)';
  }

  return { description, emoji };
}

/**
 * Get trend score for reputation calculator (0-100)
 * This feeds into the 25% "trend_direction" weight
 */
export function getTrendScore(trendAnalysis) {
  const { overall_direction, momentum, velocity, confidence } = trendAnalysis;

  let baseScore = 50; // Neutral

  // Direction impact
  switch (overall_direction) {
    case 'IMPROVING':
      baseScore = 75;
      break;
    case 'DECLINING':
      baseScore = 25;
      break;
    case 'STABLE':
      baseScore = 50;
      break;
  }

  // Momentum adjustment
  const momentumBonus = momentum * 25; // -25 to +25
  baseScore += momentumBonus;

  // Recent trend matters more
  if (velocity.rating_change_30d > 0.2) baseScore += 10;
  if (velocity.rating_change_30d < -0.2) baseScore -= 10;

  // Confidence penalty
  if (confidence === 'LOW') {
    baseScore *= 0.8; // 20% penalty for low confidence
  } else if (confidence === 'MEDIUM') {
    baseScore *= 0.9; // 10% penalty for medium confidence
  }

  // Clamp to 0-100
  return Math.round(Math.max(0, Math.min(100, baseScore)));
}
