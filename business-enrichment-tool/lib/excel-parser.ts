import * as XLSX from 'xlsx';
import type { Company } from '@/types';
import { CREDITSAFE_COLUMN_MAP } from '@/types';
import { normalizeUrl } from './utils';

/**
 * Find the matching column name from possible variations
 */
function findColumnName(headers: string[], possibleNames: readonly string[]): string | null {
  const normalizedHeaders = headers.map((h) => h?.toLowerCase().trim());

  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().trim();
    const index = normalizedHeaders.findIndex(
      (h) => h === normalizedName || h?.includes(normalizedName)
    );
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
}

/**
 * Parse Excel file buffer and extract company data
 */
export function parseExcelFile(buffer: ArrayBuffer): Company[] {
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    header: 1,
    defval: '',
  }) as unknown[][];

  if (jsonData.length < 2) {
    throw new Error('Il file non contiene dati sufficienti');
  }

  // Get headers from first row
  const headers = jsonData[0] as string[];

  // Find column mappings
  const columnMap: Record<string, string | null> = {
    name: findColumnName(headers, CREDITSAFE_COLUMN_MAP.name),
    vatNumber: findColumnName(headers, CREDITSAFE_COLUMN_MAP.vatNumber),
    city: findColumnName(headers, CREDITSAFE_COLUMN_MAP.city),
    address: findColumnName(headers, CREDITSAFE_COLUMN_MAP.address),
    website: findColumnName(headers, CREDITSAFE_COLUMN_MAP.website),
    phone: findColumnName(headers, CREDITSAFE_COLUMN_MAP.phone),
    activityDescription: findColumnName(headers, CREDITSAFE_COLUMN_MAP.activityDescription),
  };

  // Validate required columns
  if (!columnMap.name) {
    throw new Error('Colonna "Nome Azienda" non trovata nel file');
  }

  // Get column indices
  const nameIndex = headers.indexOf(columnMap.name);
  const vatIndex = columnMap.vatNumber ? headers.indexOf(columnMap.vatNumber) : -1;
  const cityIndex = columnMap.city ? headers.indexOf(columnMap.city) : -1;
  const addressIndex = columnMap.address ? headers.indexOf(columnMap.address) : -1;
  const websiteIndex = columnMap.website ? headers.indexOf(columnMap.website) : -1;
  const phoneIndex = columnMap.phone ? headers.indexOf(columnMap.phone) : -1;
  const activityIndex = columnMap.activityDescription
    ? headers.indexOf(columnMap.activityDescription)
    : -1;

  // Parse data rows
  const companies: Company[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as (string | number | null)[];

    // Skip empty rows
    const name = row[nameIndex]?.toString().trim();
    if (!name) continue;

    const company: Company = {
      id: i,
      name,
      vatNumber: vatIndex >= 0 ? row[vatIndex]?.toString().trim() || '' : '',
      city: cityIndex >= 0 ? row[cityIndex]?.toString().trim() || '' : '',
      address: addressIndex >= 0 ? row[addressIndex]?.toString().trim() || '' : '',
      existingWebsite:
        websiteIndex >= 0 && row[websiteIndex]
          ? normalizeUrl(row[websiteIndex].toString().trim())
          : undefined,
      phone: phoneIndex >= 0 ? row[phoneIndex]?.toString().trim() || '' : undefined,
      activityDescription:
        activityIndex >= 0 ? row[activityIndex]?.toString().trim() || '' : undefined,
    };

    companies.push(company);
  }

  return companies;
}

/**
 * Get statistics about parsed Excel data
 */
export function getExcelStats(companies: Company[]) {
  return {
    total: companies.length,
    withVat: companies.filter((c) => c.vatNumber).length,
    withCity: companies.filter((c) => c.city).length,
    withAddress: companies.filter((c) => c.address).length,
    withExistingWebsite: companies.filter((c) => c.existingWebsite).length,
    withPhone: companies.filter((c) => c.phone).length,
  };
}
