import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

/**
 * Scrapes website HTML and metadata using Puppeteer with Advanced Evasion
 * @param {string} url - Website URL
 * @returns {Promise<Object>} Website data
 */
export async function scrapeWebsite(url) {
  let browser;
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    browser = await puppeteer.launch({
      headless: "new",
      // Use system Chromium if PUPPETEER_EXECUTABLE_PATH is set (Docker/Railway)
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Important for Docker
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled' // Critical for some detections
      ]
    });

    const page = await browser.newPage();
    
    // Randomize viewport slightly to look more human
    const width = 1920 + Math.floor(Math.random() * 100);
    const height = 1080 + Math.floor(Math.random() * 100);
    await page.setViewport({ width, height });

    // Set extra headers to look like a real browser navigation
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    });

    const startTime = Date.now();
    
    // Go to page but don't wait for network idle immediately to avoid timeouts on heavy blocking
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 45000 
    });

    // --- HUMAN SIMULATION ---
    // Scroll down a bit
    await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight / 2);
    });
    // Wait random time
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    // Move mouse slightly
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200, { steps: 10 });
    // Scroll back up
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    // Final wait for any lazy loaded content
    await new Promise(r => setTimeout(r, 2000));
    // ------------------------

    const html = await page.content();
    const $ = cheerio.load(html);
    const headers = response.headers();
    const statusCode = response.status();
    const finalUrl = page.url();

    // Check if we are still blocked (often title is "Just a moment..." or "Access denied")
    const pageTitle = $('title').text().trim();
    if (statusCode === 403 || pageTitle.includes('Forbidden') || pageTitle.includes('Access denied') || pageTitle.includes('Just a moment')) {
        console.log("⚠️  Warning: Detection likely triggered (Status 403 or Block Page)");
    }

    const description = $('meta[name="description"]').attr('content') || '';
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';

    // Extract Open Graph data
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';

    // Extract structured data (Schema.org)
    const schemaScripts = $('script[type="application/ld+json"]');
    const schemas = [];
    schemaScripts.each((i, elem) => {
      try {
        const schemaData = JSON.parse($(elem).html());
        schemas.push(schemaData);
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    await browser.close();

    const loadTime = Date.now() - startTime;

    return {
      url: finalUrl,
      html,
      $, // Return cheerio instance for further parsing
      headers,
      metadata: {
        title: pageTitle,
        description,
        favicon,
        ogTitle,
        ogDescription,
        ogImage
      },
      schemas,
      statusCode,
      loadTime
    };

  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}

/**
 * Extracts menu-related content from website
 * @param {Object} $ - Cheerio instance
 * @returns {Object} Menu analysis data
 */
export function analyzeMenuContent($) {
  // Look for menu page links
  const menuLinks = $('a').filter((i, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    return text.includes('menu') || text.includes('carta') ||
           href.includes('menu') || href.includes('carta');
  }).length;

  // Look for price indicators
  const priceElements = $('body').text().match(/€\s*\d+/g) || [];
  const hasPrices = priceElements.length > 5; // At least 5 prices visible

  // Look for food/dish images
  const images = $('img');
  let foodImages = 0;
  images.each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src.includes('menu') || src.includes('piatt') || src.includes('food') ||
        alt.toLowerCase().includes('piatt') || alt.toLowerCase().includes('food')) {
      foodImages++;
    }
  });

  // Look for opening hours
  const bodyText = $('body').text();
  const hasOpeningHours = bodyText.match(/\d{1,2}[:\.]\d{2}\s*[-–]\s*\d{1,2}[:\.]\d{2}/) !== null ||
                         bodyText.toLowerCase().includes('orari') ||
                         bodyText.toLowerCase().includes('apertur');

  // Look for booking/reservation system
  const hasBooking = $('a[href*="booking"]').length > 0 ||
                    $('a[href*="prenotazione"]').length > 0 ||
                    $('a[href*="prenota"]').length > 0 ||
                    $('button').text().toLowerCase().includes('prenota') ||
                    $('form').text().toLowerCase().includes('prenotazione');

  return {
    hasMenuSection: menuLinks > 0,
    menuLinksCount: menuLinks,
    hasPrices,
    priceCount: priceElements.length,
    foodImagesCount: foodImages,
    hasOpeningHours,
    hasBookingSystem: hasBooking
  };
}
