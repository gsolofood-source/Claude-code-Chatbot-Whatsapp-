import { NextRequest, NextResponse } from 'next/server';
import { generateId, isValidFileType, getFileType } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Store file metadata in memory (in production, use a database)
const fileStore = new Map<string, { path: string; type: 'excel' | 'pdf'; name: string }>();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nessun file caricato' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato file non supportato. Usa .xlsx, .xls o .pdf',
        },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File troppo grande. Massimo 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    // Generate unique file ID
    const fileId = generateId();
    const fileType = getFileType(file.name);
    const ext = path.extname(file.name);
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Store file metadata
    fileStore.set(fileId, {
      path: filePath,
      type: fileType!,
      name: file.name,
    });

    // Also store in a JSON file for persistence across requests
    const metadataPath = path.join(UPLOADS_DIR, `${fileId}.json`);
    await writeFile(
      metadataPath,
      JSON.stringify({
        path: filePath,
        type: fileType,
        name: file.name,
        uploadedAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      fileId,
      fileName: file.name,
      rowCount: 0, // Will be populated after parsing
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante il caricamento',
      },
      { status: 500 }
    );
  }
}

// Export for use in other routes
export { fileStore };
