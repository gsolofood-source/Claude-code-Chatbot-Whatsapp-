// Types for Business Enrichment Tool

export interface Company {
  id: number;
  name: string;
  vatNumber: string;
  city: string;
  address: string;
  existingWebsite?: string;
  phone?: string;
  activityDescription?: string;
}

export interface EnrichedCompany extends Company {
  instagramUrl?: string;
  instagramHandle?: string;
  verifiedWebsite?: string;
  googleMapsUrl?: string;
  enrichmentStatus: EnrichmentStatus;
  enrichmentDate: string;
}

export type EnrichmentStatus = 'complete' | 'partial' | 'not_found' | 'pending' | 'processing';

export interface UploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  rowCount: number;
  error?: string;
}

export interface ParseResponse {
  success: boolean;
  companies: Company[];
  totalRows: number;
  error?: string;
}

export interface EnrichmentOptions {
  searchInstagram: boolean;
  searchWebsite: boolean;
  searchGoogleMaps: boolean;
  delayBetweenRequests: number; // in milliseconds
}

export interface EnrichmentProgress {
  companyId: number;
  companyName: string;
  status: 'searching' | 'found' | 'not_found' | 'error';
  instagram?: {
    url?: string;
    handle?: string;
    found: boolean;
  };
  website?: {
    url?: string;
    found: boolean;
  };
  googleMaps?: {
    url?: string;
    found: boolean;
  };
  error?: string;
}

export interface EnrichmentStats {
  total: number;
  processed: number;
  instagramFound: number;
  websiteFound: number;
  googleMapsFound: number;
}

export interface FileData {
  id: string;
  name: string;
  data: ArrayBuffer;
  type: 'excel' | 'pdf';
  uploadedAt: Date;
}

export interface ExportRequest {
  fileId: string;
  enrichedData: EnrichedCompany[];
  originalFileName: string;
}

// Column mapping from Creditsafe export
export const CREDITSAFE_COLUMN_MAP = {
  name: ['Nome Azienda', 'Company Name', 'Ragione Sociale'],
  vatNumber: ['Partita IVA', 'VAT Number', 'P.IVA', 'Codice Fiscale'],
  city: ['Città 1', 'City', 'Città', 'Comune'],
  address: ['Indirizzo 1', 'Address', 'Indirizzo', 'Via'],
  website: ['Website', 'Sito Web', 'Web', 'URL'],
  phone: ['Telefono', 'Phone', 'Tel'],
  activityDescription: ['Descrizione Codice Attività Locale', 'Activity Description', 'Attività'],
} as const;
