// Utility functions for Business Enrichment Tool

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format date to Italian locale string
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Clean company name for search queries
 * Removes common suffixes like S.R.L., S.P.A., etc.
 */
export function cleanCompanyName(name: string): string {
  if (!name) return '';

  return name
    .replace(/\b(S\.?R\.?L\.?S?\.?|S\.?P\.?A\.?|S\.?A\.?S\.?|S\.?N\.?C\.?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract Instagram handle from URL
 */
export function extractInstagramHandle(url: string): string | null {
  if (!url) return null;

  const match = url.match(/instagram\.com\/([^/?]+)/i);
  if (match && match[1]) {
    const handle = match[1].toLowerCase();
    // Exclude non-profile paths
    if (['p', 'reel', 'stories', 'explore', 'accounts'].includes(handle)) {
      return null;
    }
    return `@${handle}`;
  }
  return null;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize URL (add https if missing)
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Check if URL is from excluded domains (social media, directories, etc.)
 */
export function isExcludedDomain(url: string): boolean {
  const excludedDomains = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'tripadvisor.com',
    'tripadvisor.it',
    'yelp.com',
    'paginegialle.it',
    'paginebianche.it',
    'youtube.com',
    'tiktok.com',
    'pinterest.com',
    'wikipedia.org',
    'trustpilot.com',
    'google.com',
    'google.it',
    'bing.com',
    'duckduckgo.com',
  ];

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return excludedDomains.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}

/**
 * Calculate enrichment completion percentage
 */
export function calculateEnrichmentPercentage(
  instagramFound: boolean,
  websiteFound: boolean,
  mapsFound: boolean
): number {
  let found = 0;
  if (instagramFound) found++;
  if (websiteFound) found++;
  if (mapsFound) found++;
  return Math.round((found / 3) * 100);
}

/**
 * Build search query for web scraping
 */
export function buildSearchQuery(
  companyName: string,
  city: string,
  type: 'instagram' | 'website' | 'maps',
  address?: string
): string {
  const cleanName = cleanCompanyName(companyName);

  switch (type) {
    case 'instagram':
      return `${cleanName} ${city} instagram`;
    case 'website':
      return `${cleanName} ${city} sito ufficiale`;
    case 'maps':
      return address
        ? `${cleanName} ${address} ${city}`
        : `${cleanName} ${city}`;
    default:
      return `${cleanName} ${city}`;
  }
}

/**
 * Parse file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file is valid type
 */
export function isValidFileType(fileName: string): boolean {
  const validExtensions = ['.xlsx', '.xls', '.pdf'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return validExtensions.includes(ext);
}

/**
 * Get file type from extension
 */
export function getFileType(fileName: string): 'excel' | 'pdf' | null {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (['.xlsx', '.xls'].includes(ext)) return 'excel';
  if (ext === '.pdf') return 'pdf';
  return null;
}
