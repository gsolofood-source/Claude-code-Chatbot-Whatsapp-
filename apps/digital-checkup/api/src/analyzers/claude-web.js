import Anthropic from '@anthropic-ai/sdk';

/**
 * Initializes Claude AI client
 * @param {string} apiKey - Anthropic API key
 * @returns {Anthropic} Anthropic client instance
 */
function initClaudeClient(apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  return new Anthropic({ apiKey });
}

/**
 * Analyzes menu quality and presentation
 * @param {Object} websiteData - Scraped website data
 * @param {Object} menuContent - Menu content analysis
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Menu analysis
 */
export async function analyzeMenuQuality(websiteData, menuContent, apiKey) {
  const client = initClaudeClient(apiKey);
  const { $, url } = websiteData;

  // Extract text content focused on menu
  const menuText = [];

  // Look for menu sections
  $('section, div, article').each((i, elem) => {
    const text = $(elem).text();
    if (text.toLowerCase().includes('menu') ||
        text.toLowerCase().includes('carta') ||
        text.toLowerCase().includes('piatti')) {
      menuText.push(text.substring(0, 500)); // Limit to avoid token overflow
    }
  });

  const prompt = `Analizza questo sito web di ristorazione e valuta la qualità del MENU e dell'OFFERTA.

URL: ${url}

Elementi rilevati automaticamente:
- Sezione menu presente: ${menuContent.hasMenuSection ? 'Sì' : 'No'}
- Prezzi visibili: ${menuContent.hasPrices ? 'Sì (' + menuContent.priceCount + ' prezzi)' : 'No'}
- Immagini piatti: ${menuContent.foodImagesCount} immagini
- Orari apertura: ${menuContent.hasOpeningHours ? 'Sì' : 'No'}
- Sistema prenotazioni: ${menuContent.hasBookingSystem ? 'Sì' : 'No'}

Testo menu estratto:
${menuText.join('\n---\n').substring(0, 2000)}

Valuta (0-100):
1. **Chiarezza prezzi**: Sono visibili e facili da trovare?
2. **Descrizioni piatti**: Sono evocative, dettagliate, fanno venire fame?
3. **Completezza**: Menu completo con antipasti, primi, secondi, dolci?
4. **Informazioni pratiche**: Orari, giorni chiusura, modalità prenotazione chiare?
5. **Fotografie**: Presenza e qualità (anche se non puoi vedere le immagini, deducilo dal contesto)

Rispondi in JSON:
{
  "score": <0-100>,
  "feedback": "<2-3 frasi concise>",
  "strongPoints": ["punto 1", "punto 2"],
  "weaknesses": ["punto 1", "punto 2"]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);

    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback,
      strongPoints: result.strongPoints || [],
      weaknesses: result.weaknesses || []
    };
  } catch (error) {
    console.error('Claude API error (menu):', error.message);
    return {
      score: 50,
      feedback: 'Analisi non disponibile',
      strongPoints: [],
      weaknesses: []
    };
  }
}

/**
 * Analyzes brand identity and emotional appeal
 * @param {Object} websiteData - Scraped website data
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} Brand analysis
 */
export async function analyzeBrandIdentity(websiteData, apiKey) {
  const client = initClaudeClient(apiKey);
  const { metadata, $, url } = websiteData;

  // Extract homepage text content
  const heroText = $('h1, h2').first().text() || '';
  const aboutText = $('section, div').filter((i, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes('storia') || text.includes('chi siamo') ||
           text.includes('about') || text.includes('passione');
  }).first().text().substring(0, 500) || '';

  const prompt = `Analizza l'identità di BRAND e l'appeal EMOZIONALE di questo sito ristorazione.

URL: ${url}
Titolo: ${metadata.title}
Descrizione: ${metadata.description}
Hero/Headline: ${heroText}
About/Storia: ${aboutText}

Valuta (0-100):
1. **Tone of voice**: È coerente, autentico, distintivo?
2. **Storytelling**: Racconta una storia coinvolgente? C'è passione?
3. **Differenziazione**: Si distingue dai competitor o è generico?
4. **Emozione**: Trasmette desiderio di visitare il locale?
5. **Coerenza**: Brand identity chiara e consistente?

Rispondi in JSON:
{
  "score": <0-100>,
  "feedback": "<2-3 frasi concise>",
  "brandPersonality": "<descrizione breve stile brand>"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);

    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback,
      brandPersonality: result.brandPersonality || 'Non definita'
    };
  } catch (error) {
    console.error('Claude API error (brand):', error.message);
    return {
      score: 50,
      feedback: 'Analisi non disponibile',
      brandPersonality: 'Non determinata'
    };
  }
}

/**
 * Analyzes UX and mobile experience
 * @param {Object} websiteData - Scraped website data
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<Object>} UX analysis
 */
export async function analyzeUX(websiteData, apiKey) {
  const client = initClaudeClient(apiKey);
  const { $, metadata } = websiteData;

  // Analyze structure
  const hasNav = $('nav').length > 0;
  const h1Count = $('h1').length;
  const hasContactCTA = $('a[href*="tel:"], a[href*="mailto:"], button').filter((i, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes('contatt') || text.includes('prenota') || text.includes('chiama');
  }).length > 0;

  const hasMobileViewport = $('meta[name="viewport"]').length > 0;
  const navLinksCount = $('nav a').length;

  const prompt = `Valuta la UX (User Experience) di questo sito web ristorazione.

Elementi rilevati:
- Navigation menu: ${hasNav ? 'Sì (' + navLinksCount + ' link)' : 'No'}
- H1 tags: ${h1Count} (ideale: 1)
- Mobile viewport: ${hasMobileViewport ? 'Sì' : 'No'}
- CTA contatto/prenotazione visibile: ${hasContactCTA ? 'Sì' : 'No'}
- Titolo pagina: ${metadata.title}

Valuta (0-100):
1. **Navigation**: Menu intuitivo e ben organizzato?
2. **Gerarchia**: Informazioni importanti in evidenza (location, contatti, orari)?
3. **CTA chiari**: Bottoni "Prenota", "Chiama", "Indicazioni" visibili?
4. **Mobile-friendly**: Ottimizzato per smartphone?
5. **Semplicità**: Facile trovare info senza perdersi?

Rispondi in JSON:
{
  "score": <0-100>,
  "feedback": "<2-3 frasi concise>"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);

    return {
      score: Math.min(100, Math.max(0, result.score)),
      feedback: result.feedback
    };
  } catch (error) {
    console.error('Claude API error (UX):', error.message);
    return {
      score: 50,
      feedback: 'Analisi non disponibile'
    };
  }
}
