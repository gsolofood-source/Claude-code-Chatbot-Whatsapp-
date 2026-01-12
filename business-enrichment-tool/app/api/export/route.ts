import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { EnrichedCompany } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrichedData, originalFileName } = body as {
      enrichedData: EnrichedCompany[];
      originalFileName?: string;
    };

    if (!enrichedData || !Array.isArray(enrichedData) || enrichedData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nessun dato da esportare' },
        { status: 400 }
      );
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Business Enrichment Tool';
    workbook.created = new Date();

    // Create worksheet
    const worksheet = workbook.addWorksheet('Dati Arricchiti');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome Azienda', key: 'name', width: 35 },
      { header: 'Partita IVA', key: 'vatNumber', width: 15 },
      { header: 'Città', key: 'city', width: 20 },
      { header: 'Indirizzo', key: 'address', width: 40 },
      { header: 'Telefono', key: 'phone', width: 15 },
      { header: 'Attività', key: 'activityDescription', width: 40 },
      { header: 'Instagram URL', key: 'instagramUrl', width: 40 },
      { header: 'Instagram Handle', key: 'instagramHandle', width: 20 },
      { header: 'Website Verificato', key: 'verifiedWebsite', width: 40 },
      { header: 'Google Maps URL', key: 'googleMapsUrl', width: 50 },
      { header: 'Enrichment Status', key: 'enrichmentStatus', width: 18 },
      { header: 'Data Enrichment', key: 'enrichmentDate', width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add data rows
    enrichedData.forEach((company) => {
      const row = worksheet.addRow({
        id: company.id,
        name: company.name,
        vatNumber: company.vatNumber || '',
        city: company.city || '',
        address: company.address || '',
        phone: company.phone || '',
        activityDescription: company.activityDescription || '',
        instagramUrl: company.instagramUrl || '',
        instagramHandle: company.instagramHandle || '',
        verifiedWebsite: company.verifiedWebsite || company.existingWebsite || '',
        googleMapsUrl: company.googleMapsUrl || '',
        enrichmentStatus: getStatusLabel(company.enrichmentStatus),
        enrichmentDate: company.enrichmentDate || new Date().toISOString(),
      });

      // Style status cell based on value
      const statusCell = row.getCell('enrichmentStatus');
      switch (company.enrichmentStatus) {
        case 'complete':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' },
          };
          statusCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
        case 'partial':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF59E0B' },
          };
          statusCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
        case 'not_found':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEF4444' },
          };
          statusCell.font = { color: { argb: 'FFFFFFFF' } };
          break;
      }

      // Add hyperlinks to URLs
      if (company.instagramUrl) {
        const cell = row.getCell('instagramUrl');
        cell.value = {
          text: company.instagramUrl,
          hyperlink: company.instagramUrl,
        };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }

      if (company.verifiedWebsite) {
        const cell = row.getCell('verifiedWebsite');
        cell.value = {
          text: company.verifiedWebsite,
          hyperlink: company.verifiedWebsite,
        };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }

      if (company.googleMapsUrl) {
        const cell = row.getCell('googleMapsUrl');
        cell.value = {
          text: company.googleMapsUrl,
          hyperlink: company.googleMapsUrl,
        };
        cell.font = { color: { argb: 'FF2563EB' }, underline: true };
      }
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'M1',
    };

    // Freeze first row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add statistics sheet
    const statsSheet = workbook.addWorksheet('Statistiche');
    statsSheet.columns = [
      { header: 'Metrica', key: 'metric', width: 30 },
      { header: 'Valore', key: 'value', width: 15 },
      { header: 'Percentuale', key: 'percentage', width: 15 },
    ];

    const total = enrichedData.length;
    const instagramFound = enrichedData.filter((c) => c.instagramUrl).length;
    const websiteFound = enrichedData.filter((c) => c.verifiedWebsite).length;
    const mapsFound = enrichedData.filter((c) => c.googleMapsUrl).length;
    const complete = enrichedData.filter((c) => c.enrichmentStatus === 'complete').length;
    const partial = enrichedData.filter((c) => c.enrichmentStatus === 'partial').length;
    const notFound = enrichedData.filter((c) => c.enrichmentStatus === 'not_found').length;

    statsSheet.addRows([
      { metric: 'Totale Aziende', value: total, percentage: '100%' },
      {
        metric: 'Instagram Trovati',
        value: instagramFound,
        percentage: `${Math.round((instagramFound / total) * 100)}%`,
      },
      {
        metric: 'Siti Web Trovati',
        value: websiteFound,
        percentage: `${Math.round((websiteFound / total) * 100)}%`,
      },
      {
        metric: 'Google Maps Trovati',
        value: mapsFound,
        percentage: `${Math.round((mapsFound / total) * 100)}%`,
      },
      { metric: '', value: '', percentage: '' },
      {
        metric: 'Enrichment Completo',
        value: complete,
        percentage: `${Math.round((complete / total) * 100)}%`,
      },
      {
        metric: 'Enrichment Parziale',
        value: partial,
        percentage: `${Math.round((partial / total) * 100)}%`,
      },
      {
        metric: 'Non Trovato',
        value: notFound,
        percentage: `${Math.round((notFound / total) * 100)}%`,
      },
    ]);

    // Style stats header
    const statsHeaderRow = statsSheet.getRow(1);
    statsHeaderRow.font = { bold: true };
    statsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename
    const baseName = originalFileName
      ? originalFileName.replace(/\.[^/.]+$/, '')
      : 'export';
    const fileName = `${baseName}_enriched_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante l\'export',
      },
      { status: 500 }
    );
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'complete':
      return 'Completo';
    case 'partial':
      return 'Parziale';
    case 'not_found':
      return 'Non Trovato';
    case 'pending':
      return 'In Attesa';
    case 'processing':
      return 'In Elaborazione';
    default:
      return status;
  }
}
