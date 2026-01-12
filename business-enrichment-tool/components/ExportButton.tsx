'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { EnrichedCompany } from '@/types';

interface ExportButtonProps {
  data: EnrichedCompany[];
  fileName?: string;
}

export default function ExportButton({ data, fileName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (data.length === 0) return;

    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrichedData: data,
          originalFileName: fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'export');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let exportFileName = `export_enriched_${new Date().toISOString().slice(0, 10)}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          exportFileName = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleExport}
        disabled={isExporting || data.length === 0}
        className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          exportSuccess
            ? 'bg-green-600 text-white'
            : exportError
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Esportazione...
          </>
        ) : exportSuccess ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Scaricato!
          </>
        ) : exportError ? (
          <>
            <AlertCircle className="w-5 h-5" />
            Errore
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Scarica Excel
          </>
        )}
      </button>

      {exportError && (
        <p className="mt-2 text-sm text-red-600">{exportError}</p>
      )}
    </div>
  );
}
