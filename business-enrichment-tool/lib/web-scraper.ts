import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  buildSearchQuery,
  extractInstagramHandle,
  isExcludedDomain,
  delay,
} from './utils';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface SearchResult {
  url: string;
  title: string;
  description?: string;
}

/**
 * Search using DuckDuckGo HTML (no API key required)
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    // DuckDuckGo HTML results structure
    $('.result').each((_, element) => {
      const linkElement = $(element).find('.result__a');
      const href = linkElement.attr('href');
      const title = linkElement.text().trim();
      const description = $(element).find('.result__snippet').text().trim();

      if (href) {
        // DuckDuckGo wraps URLs in a redirect, need to extract actual URL
        const urlMatch = href.match(/uddg=([^&]+)/);
        const actualUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : href;

        results.push({
          url: actualUrl,
          title,
          description,
        });
      }
    });

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Search for Instagram profile
 */
export async function searchInstagram(
  companyName: string,
  city: string
): Promise<{ url?: string; handle?: string }> {
  const query = buildSearchQuery(companyName, city, 'instagram');
  const results = await searchDuckDuckGo(query);

  // Find Instagram URLs
  for (const result of results) {
    if (result.url.includes('instagram.com/')) {
      const handle = extractInstagramHandle(result.url);
      if (handle) {
        // Make sure it's not a post or reel URL
        const cleanUrl = result.url.split('?')[0];
        if (!cleanUrl.includes('/p/') && !cleanUrl.includes('/reel/')) {
          return {
            url: cleanUrl,
            handle,
          };
        }
      }
    }
  }

  // Try alternative search with just company name
  if (results.length === 0) {
    await delay(500);
    const altResults = await searchDuckDuckGo(`${companyName} instagram`);
    for (const result of altResults) {
      if (result.url.includes('instagram.com/')) {
        const handle = extractInstagramHandle(result.url);
        if (handle) {
          const cleanUrl = result.url.split('?')[0];
          if (!cleanUrl.includes('/p/') && !cleanUrl.includes('/reel/')) {
            return {
              url: cleanUrl,
              handle,
            };
          }
        }
      }
    }
  }

  return {};
}

/**
 * Search for company website
 */
export async function searchWebsite(
  companyName: string,
  city: string,
  existingWebsite?: string
): Promise<{ url?: string }> {
  // If existing website is provided, verify it's valid
  if (existingWebsite) {
    try {
      const response = await axios.head(existingWebsite, {
        timeout: 5000,
        headers: { 'User-Agent': USER_AGENT },
        maxRedirects: 3,
      });
      if (response.status >= 200 && response.status < 400) {
        return { url: existingWebsite };
      }
    } catch {
      // Website not reachable, search for a new one
    }
  }

  const query = buildSearchQuery(companyName, city, 'website');
  const results = await searchDuckDuckGo(query);

  // Find valid website (not social media or directories)
  for (const result of results) {
    if (!isExcludedDomain(result.url)) {
      // Additional checks to ensure it looks like a company website
      const hostname = new URL(result.url).hostname.toLowerCase();

      // Check if domain might match company name
      const normalizedCompanyName = companyName
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');

      const normalizedHostname = hostname
        .replace(/^www\./, '')
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9]/g, '');

      // Prefer domains that match company name
      if (normalizedHostname.includes(normalizedCompanyName.slice(0, 5))) {
        return { url: result.url };
      }
    }
  }

  // If no matching domain found, return first non-excluded result
  for (const result of results) {
    if (!isExcludedDomain(result.url)) {
      return { url: result.url };
    }
  }

  return {};
}

/**
 * Search for Google Maps / My Business link
 */
export async function searchGoogleMaps(
  companyName: string,
  city: string,
  address?: string
): Promise<{ url?: string }> {
  const query = buildSearchQuery(companyName, city, 'maps', address);
  const results = await searchDuckDuckGo(`${query} google maps`);

  // Find Google Maps URLs
  for (const result of results) {
    if (
      result.url.includes('google.com/maps') ||
      result.url.includes('google.it/maps') ||
      result.url.includes('maps.google.')
    ) {
      return { url: result.url };
    }
  }

  // If no direct link found, create a search link
  const searchQuery = encodeURIComponent(`${companyName} ${address || ''} ${city}`);
  return {
    url: `https://www.google.com/maps/search/${searchQuery}`,
  };
}

/**
 * Enrich a single company with all data
 */
export async function enrichCompany(
  companyName: string,
  city: string,
  address?: string,
  existingWebsite?: string,
  options?: {
    searchInstagram?: boolean;
    searchWebsite?: boolean;
    searchGoogleMaps?: boolean;
    delayMs?: number;
  }
): Promise<{
  instagram?: { url?: string; handle?: string };
  website?: { url?: string };
  googleMaps?: { url?: string };
}> {
  const result: {
    instagram?: { url?: string; handle?: string };
    website?: { url?: string };
    googleMaps?: { url?: string };
  } = {};

  const delayMs = options?.delayMs || 1500;

  // Search Instagram
  if (options?.searchInstagram !== false) {
    result.instagram = await searchInstagram(companyName, city);
    await delay(delayMs);
  }

  // Search Website
  if (options?.searchWebsite !== false) {
    result.website = await searchWebsite(companyName, city, existingWebsite);
    await delay(delayMs);
  }

  // Search Google Maps
  if (options?.searchGoogleMaps !== false) {
    result.googleMaps = await searchGoogleMaps(companyName, city, address);
  }

  return result;
}
