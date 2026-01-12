import type { Company } from '@/types';
import { normalizeUrl } from './utils';

// Note: pdf-parse is used server-side only
// This file contains the parsing logic for PDF files

/**
 * Extract text from PDF buffer and parse company data
 * This function should be called from an API route with pdf-parse
 */
export async function parsePdfText(text: string): Promise<Company[]> {
  const companies: Company[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Try to identify table structure
  // Common patterns in Creditsafe PDFs:
  // - Company name followed by details
  // - Tabular data with headers

  let currentCompany: Partial<Company> | null = null;
  let companyId = 1;

  // Regex patterns for common data
  const vatPattern = /\b\d{11}\b/; // Italian VAT number (11 digits)
  const websitePattern = /(?:www\.|https?:\/\/)[^\s]+/i;
  const cityPattern = /^[A-Z]{2,}\s+\([A-Z]{2}\)$/; // City pattern like "MESSINA (ME)"

  for (const line of lines) {
    // Check for VAT number
    const vatMatch = line.match(vatPattern);
    if (vatMatch) {
      if (currentCompany) {
        currentCompany.vatNumber = vatMatch[0];
      }
      continue;
    }

    // Check for website
    const websiteMatch = line.match(websitePattern);
    if (websiteMatch) {
      if (currentCompany) {
        currentCompany.existingWebsite = normalizeUrl(websiteMatch[0]);
      }
      continue;
    }

    // Check for city pattern
    const cityMatch = line.match(cityPattern);
    if (cityMatch) {
      if (currentCompany) {
        currentCompany.city = cityMatch[0].replace(/\s*\([A-Z]{2}\)/, '').trim();
      }
      continue;
    }

    // If line looks like a company name (all caps, contains specific suffixes)
    if (
      /^[A-Z0-9\s\.\-'&]+$/.test(line) &&
      (line.includes('S.R.L') ||
        line.includes('S.P.A') ||
        line.includes('S.N.C') ||
        line.includes('S.A.S') ||
        line.includes('SRL') ||
        line.includes('SPA') ||
        line.length > 5)
    ) {
      // Save previous company if exists
      if (currentCompany && currentCompany.name) {
        companies.push({
          id: companyId++,
          name: currentCompany.name,
          vatNumber: currentCompany.vatNumber || '',
          city: currentCompany.city || '',
          address: currentCompany.address || '',
          existingWebsite: currentCompany.existingWebsite,
          phone: currentCompany.phone,
          activityDescription: currentCompany.activityDescription,
        });
      }

      // Start new company
      currentCompany = {
        name: line,
      };
    }
  }

  // Don't forget the last company
  if (currentCompany && currentCompany.name) {
    companies.push({
      id: companyId,
      name: currentCompany.name,
      vatNumber: currentCompany.vatNumber || '',
      city: currentCompany.city || '',
      address: currentCompany.address || '',
      existingWebsite: currentCompany.existingWebsite,
      phone: currentCompany.phone,
      activityDescription: currentCompany.activityDescription,
    });
  }

  return companies;
}

/**
 * Alternative table-based PDF parsing
 * Tries to identify rows in a tabular format
 */
export function parseTabularPdf(text: string, headers: string[]): Company[] {
  const companies: Company[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (
      line.includes('nome') ||
      line.includes('azienda') ||
      line.includes('company')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fall back to pattern-based parsing
    return parsePdfText(text) as unknown as Company[];
  }

  // Parse data rows
  let companyId = 1;
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip if line is too short
    if (line.length < 10) continue;

    // Try to split by common delimiters
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('  ')) {
      parts = line.split(/\s{2,}/);
    } else {
      continue;
    }

    if (parts.length >= 1 && parts[0]) {
      companies.push({
        id: companyId++,
        name: parts[0].trim(),
        vatNumber: parts[1]?.trim() || '',
        city: parts[2]?.trim() || '',
        address: parts[3]?.trim() || '',
        existingWebsite: parts[4] ? normalizeUrl(parts[4].trim()) : undefined,
      });
    }
  }

  return companies;
}
