import axios from 'axios';

/**
 * Resolve a Google Maps URL (short or full) to extract Place ID
 * Supports:
 * - Short URLs: https://maps.app.goo.gl/xxxxx
 * - Full URLs: https://www.google.com/maps/place/...
 * - URLs with place_id parameter
 * - URLs with CID (customer ID)
 *
 * @param {string} url - Google Maps URL
 * @returns {Promise<Object>} Resolved place info { placeId, name, resolved: true/false }
 */
export async function resolveGoogleMapsUrl(url) {
  if (!url) {
    return { placeId: null, resolved: false, error: 'No URL provided' };
  }

  try {
    let fullUrl = url;

    // Step 1: If it's a short URL, follow redirects to get full URL
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
      const response = await axios.get(url, {
        maxRedirects: 5,
        validateStatus: () => true, // Accept all status codes
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Get the final URL after redirects
      fullUrl = response.request?.res?.responseUrl || response.request?._redirectable?._currentUrl || url;
    }

    // Step 2: Extract Place ID from various URL formats
    let placeId = null;
    let placeName = null;

    // Format 1: place_id in query string
    // https://www.google.com/maps/place/?q=place_id:ChIJ...
    const placeIdMatch = fullUrl.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    if (placeIdMatch) {
      placeId = placeIdMatch[1];
    }

    // Format 2: Place ID in data parameter (1s prefix)
    // https://www.google.com/maps/place/.../data=...!1sChIJ...
    if (!placeId) {
      const dataMatch = fullUrl.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (dataMatch) {
        placeId = dataMatch[1];
      }
    }

    // Format 3: ftid parameter (feature ID, same as Place ID)
    // https://www.google.com/maps?ftid=0x...
    if (!placeId) {
      const ftidMatch = fullUrl.match(/ftid=([^&]+)/);
      if (ftidMatch) {
        // ftid format: 0x...:0x... - we need to convert this
        // This is a hex-encoded place reference, not directly usable
        // We'll need to search by coordinates instead
      }
    }

    // Format 4: Extract place name from URL for fallback search
    // https://www.google.com/maps/place/Restaurant+Name/...
    const placeNameMatch = fullUrl.match(/\/maps\/place\/([^/@]+)/);
    if (placeNameMatch) {
      placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
    }

    // Format 5: Extract coordinates for nearby search if no Place ID
    // @45.123456,11.123456,17z
    let coordinates = null;
    const coordMatch = fullUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      coordinates = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      };
    }

    return {
      placeId,
      placeName,
      coordinates,
      fullUrl,
      resolved: !!(placeId || placeName || coordinates)
    };

  } catch (error) {
    return {
      placeId: null,
      resolved: false,
      error: `Failed to resolve URL: ${error.message}`
    };
  }
}

/**
 * Check if a string looks like a Google Maps URL
 * @param {string} str - String to check
 * @returns {boolean}
 */
export function isGoogleMapsUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return str.includes('google.com/maps') ||
         str.includes('maps.google.com') ||
         str.includes('maps.app.goo.gl') ||
         str.includes('goo.gl/maps');
}

/**
 * Google Places API (Hybrid) scraper for restaurant reviews
 *
 * Uses:
 * - Places API (New) for search and basic data
 * - Places API (Legacy) for detailed reviews (up to 20)
 *
 * Accepts:
 * - businessName: "Restaurant Name, City" OR a Google Maps URL
 * - If businessName is a Google Maps URL, it will be resolved automatically
 *
 * @param {string} businessName - Restaurant name/location OR Google Maps URL
 * @param {string} apiKey - Google Places API key
 * @param {string} placeId - Optional Google Place ID for direct lookup
 * @returns {Promise<Object>} Reviews data with ratings, reviews, and metadata
 */
export async function scrapeGoogleReviews(businessName, apiKey, placeId = null) {
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not found in environment variables');
  }

  try {
    let finalPlaceId = placeId;
    let multipleResultsWarning = null;
    let placeName = businessName;
    let placeAddress = '';
    let placeRating = 0;
    let totalReviews = 0;
    let searchQuery = businessName;

    // Step 0: Check if businessName is a Google Maps URL and resolve it
    if (!placeId && isGoogleMapsUrl(businessName)) {
      console.log(`[INFO] Detected Google Maps URL, resolving...`);
      const resolved = await resolveGoogleMapsUrl(businessName);

      if (resolved.resolved) {
        if (resolved.placeId) {
          // Best case: we got a Place ID directly
          finalPlaceId = resolved.placeId;
          console.log(`[INFO] Resolved Place ID: ${finalPlaceId}`);
        } else if (resolved.placeName) {
          // Fallback: use extracted place name for search
          searchQuery = resolved.placeName;
          console.log(`[INFO] Resolved place name: ${searchQuery}`);
        } else if (resolved.coordinates) {
          // Use coordinates + name for more precise search
          searchQuery = resolved.placeName || `restaurant near ${resolved.coordinates.lat},${resolved.coordinates.lng}`;
          console.log(`[INFO] Using coordinates for search: ${searchQuery}`);
        }
      } else {
        throw new Error(`Could not resolve Google Maps URL: ${resolved.error || 'Unknown error'}`);
      }
    }

    // Step 1: Search for the place using Text Search API (skip if placeId already resolved)
    if (!finalPlaceId) {
      const searchUrl = 'https://places.googleapis.com/v1/places:searchText';

      const searchPayload = {
        textQuery: searchQuery  // Use resolved query (could be original name or extracted from URL)
      };

      const searchHeaders = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri'
      };

      const searchResponse = await axios.post(searchUrl, searchPayload, { headers: searchHeaders });

      if (!searchResponse.data.places || searchResponse.data.places.length === 0) {
        throw new Error(`No restaurants found matching: "${searchQuery}". Try being more specific with the address or use a direct Google Maps URL.`);
      }

      const results = searchResponse.data.places;

      // Check for multiple results
      if (results.length > 1) {
        multipleResultsWarning = {
          count: results.length,
          alternatives: results.slice(0, 3).map(r => ({
            name: r.displayName?.text || 'Unknown',
            address: r.formattedAddress || 'Unknown',
            rating: r.rating || 0,
            place_id: r.id
          }))
        };
      }

      const place = results[0];
      finalPlaceId = place.id;
      placeName = place.displayName?.text || businessName;
      placeAddress = place.formattedAddress || '';
      placeRating = place.rating || 0;
      totalReviews = place.userRatingCount || 0;
    }

    // Step 2: Get detailed reviews using LEGACY API (supports up to 20 reviews)
    // The new API only returns 5 reviews, so we use the legacy endpoint for better analysis
    const legacyDetailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const legacyDetailsParams = {
      place_id: convertToLegacyPlaceId(finalPlaceId),
      fields: 'name,formatted_address,rating,user_ratings_total,reviews,url,opening_hours,website,formatted_phone_number,photos,types,editorial_summary,business_status',
      reviews_sort: 'newest',
      key: apiKey
    };

    const legacyResponse = await axios.get(legacyDetailsUrl, { params: legacyDetailsParams });

    if (legacyResponse.data.status !== 'OK') {
      throw new Error(`Legacy API error: ${legacyResponse.data.status} - ${legacyResponse.data.error_message || 'Unknown error'}`);
    }

    const details = legacyResponse.data.result;

    // Update with detailed info if we used placeId directly
    if (placeId) {
      placeName = details.name || businessName;
      placeAddress = details.formatted_address || '';
      placeRating = details.rating || 0;
      totalReviews = details.user_ratings_total || 0;
    }

    // Step 3: Process reviews and calculate response rate
    const reviews = (details.reviews || []).slice(0, 20); // Get latest 20 reviews

    let responsesCount = 0;
    const processedReviews = reviews.map(review => {
      // Legacy API structure: author_name, time, text, rating
      const hasResponse = review.author_url && review.author_url.includes('owner_response');
      if (hasResponse) responsesCount++;

      // Legacy API uses Unix timestamp in seconds
      const reviewDate = new Date(review.time * 1000).toISOString().split('T')[0];
      const timestamp = review.time;

      return {
        author: review.author_name || 'Anonymous',
        rating: review.rating || 0,
        date: reviewDate,
        text: review.text || '',
        relativeTime: review.relative_time_description || '',
        timestamp: timestamp,
        helpful: null // Legacy API doesn't provide this
      };
    });

    const responseRate = reviews.length > 0
      ? Math.round((responsesCount / reviews.length) * 100)
      : 0;

    // Step 4: Calculate rating distribution (estimate, API doesn't provide exact counts)
    // We'll use the reviews we have as a sample
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    processedReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });

    // Step 5: Extract GMB completeness data
    const photos = details.photos || [];
    const photoCount = photos.length;
    const hasLogo = photos.some(p => p.photo_reference); // First photo typically logo
    const hasCoverPhoto = photoCount >= 2;

    const openingHours = details.opening_hours || {};
    const hasOpeningHours = !!openingHours.weekday_text;
    const hoursComplete = openingHours.weekday_text?.length === 7;

    const description = details.editorial_summary?.overview || '';
    const website = details.website || '';
    const phoneNumber = details.formatted_phone_number || '';
    const primaryCategory = details.types?.[0] || '';
    const secondaryCategories = details.types?.slice(1) || [];

    // Check for menu (heuristic: if 'menu' is in types or has menu photos)
    const hasMenu = details.types?.includes('menu') ||
                    photos.some(p => p.html_attributions?.some(attr => attr.toLowerCase().includes('menu')));

    return {
      platform: 'google',
      restaurantName: placeName,
      address: placeAddress,
      mapsUrl: details.url || '',
      placeId: finalPlaceId,
      rating: placeRating,
      totalReviews: totalReviews,
      reviews: processedReviews,
      ratingDistribution: distribution,
      responseRate: responseRate,
      isOpen: details.opening_hours?.open_now ?? null,
      multipleResultsWarning,
      scrapedAt: new Date().toISOString(),
      // GMB Completeness Data
      photoCount,
      hasLogo,
      hasCoverPhoto,
      hasOpeningHours,
      hoursComplete,
      hasMenu,
      website,
      phoneNumber,
      description,
      primaryCategory,
      secondaryCategories,
      attributes: details.types || [],
      // Additional engagement data (to be populated if available)
      hasRecentPosts: false, // Legacy API doesn't provide posts
      postCount30d: 0,
      hasQA: false
    };

  } catch (error) {
    if (error.response) {
      // Google API error
      const errorMessage = error.response.data.error?.message || error.response.data.error_message || `HTTP ${error.response.status}`;
      throw new Error(`Google Places API error: ${errorMessage}`);
    }
    if (error.message) {
      throw error; // Re-throw errors with messages
    }
    throw new Error(`Unexpected error during Google API call`);
  }
}

/**
 * Convert New Places API ID to Legacy API format
 * New API: "places/ChIJN1t_tDeuEmsRUsoyG83frY4"
 * Legacy API: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 */
function convertToLegacyPlaceId(placeId) {
  if (!placeId) return null;
  
  // Se inizia con "places/", rimuovi il prefisso
  if (placeId.startsWith('places/')) {
    return placeId.replace('places/', '');
  }
  
  // Altrimenti ritorna così com'è (è già in formato legacy)
  return placeId;
}

/**
 * Calculate time-based metrics from reviews
 * @param {Array} reviews - Array of review objects with timestamps
 * @returns {Object} Time-based metrics (30d, 90d, 6m, 1y)
 */
export function calculateTimeMetrics(reviews) {
  const now = Date.now() / 1000; // Current time in seconds
  const day = 24 * 60 * 60;

  const timeframes = {
    last_30_days: { reviews: [], avgRating: 0, count: 0 },
    last_90_days: { reviews: [], avgRating: 0, count: 0 },
    last_6_months: { reviews: [], avgRating: 0, count: 0 },
    last_year: { reviews: [], avgRating: 0, count: 0 }
  };

  reviews.forEach(review => {
    const age = now - review.timestamp;

    if (age <= 30 * day) {
      timeframes.last_30_days.reviews.push(review);
    }
    if (age <= 90 * day) {
      timeframes.last_90_days.reviews.push(review);
    }
    if (age <= 180 * day) {
      timeframes.last_6_months.reviews.push(review);
    }
    if (age <= 365 * day) {
      timeframes.last_year.reviews.push(review);
    }
  });

  // Calculate averages for each timeframe
  Object.keys(timeframes).forEach(key => {
    const frame = timeframes[key];
    frame.count = frame.reviews.length;
    if (frame.count > 0) {
      frame.avgRating = parseFloat(
        (frame.reviews.reduce((sum, r) => sum + r.rating, 0) / frame.count).toFixed(2)
      );
    }
    delete frame.reviews; // Remove reviews array, keep only metrics
  });

  return timeframes;
}
