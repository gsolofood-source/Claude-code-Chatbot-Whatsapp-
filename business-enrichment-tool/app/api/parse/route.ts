import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { parseExcelFile } from '@/lib/excel-parser';
import { parsePdfText } from '@/lib/pdf-parser';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'ID file mancante' },
        { status: 400 }
      );
    }

    // Find file metadata
    const metadataPath = path.join(UPLOADS_DIR, `${fileId}.json`);
    if (!existsSync(metadataPath)) {
      return NextResponse.json(
        { success: false, error: 'File non trovato' },
        { status: 404 }
      );
    }

    const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'));
    const filePath = metadata.path;

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File non trovato sul disco' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    let companies;

    if (metadata.type === 'excel') {
      // Parse Excel file
      companies = parseExcelFile(fileBuffer.buffer as ArrayBuffer);
    } else if (metadata.type === 'pdf') {
      // Parse PDF file
      // Note: pdf-parse requires dynamic import in Next.js
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(fileBuffer);
        companies = await parsePdfText(pdfData.text);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: 'Errore durante il parsing del PDF. Prova con un file Excel.',
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Tipo file non supportato' },
        { status: 400 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nessuna azienda trovata nel file. Verifica il formato.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      companies,
      totalRows: companies.length,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante il parsing',
      },
      { status: 500 }
    );
  }
}
