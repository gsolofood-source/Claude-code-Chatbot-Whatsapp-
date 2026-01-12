'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import {
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { Company } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Check if there's already uploaded file data
  useEffect(() => {
    const storedData = localStorage.getItem('enrichment_file');
    if (storedData) {
      const { fileId: storedFileId } = JSON.parse(storedData);
      if (storedFileId) {
        setFileId(storedFileId);
        setUploadSuccess(true);
      }
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    setCompanies([]);
    setParseError(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setFileId(null);
    setCompanies([]);
    setParseError(null);
    localStorage.removeItem('enrichment_file');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il caricamento');
      }

      setFileId(data.fileId);
      setUploadSuccess(true);

      localStorage.setItem(
        'enrichment_file',
        JSON.stringify({
          fileId: data.fileId,
          fileName: data.fileName,
          rowCount: data.rowCount,
        })
      );

      // Auto-parse after upload
      await handleParse(data.fileId);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleParse = async (fId?: string) => {
    const targetFileId = fId || fileId;
    if (!targetFileId) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: targetFileId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il parsing');
      }

      setCompanies(data.companies);

      // Store companies for enrichment page
      localStorage.setItem('enrichment_companies', JSON.stringify(data.companies));
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsParsing(false);
    }
  };

  const handleProceedToEnrichment = () => {
    router.push('/enrichment');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Carica e Analizza File
        </h1>
        <p className="text-gray-600">
          Carica il tuo file Excel o PDF e visualizza i dati estratti
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Carica il file
          </h2>
          <FileUploader
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            uploadSuccess={uploadSuccess}
          />

          {selectedFile && !uploadSuccess && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Caricamento in corso...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-5 h-5" />
                  Carica e Analizza
                </>
              )}
            </button>
          )}

          {uploadSuccess && companies.length === 0 && !isParsing && (
            <button
              onClick={() => handleParse()}
              className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Analizza File
            </button>
          )}
        </div>

        {/* Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            2. Riepilogo Dati
          </h2>

          {isParsing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Analisi del file in corso...</p>
            </div>
          ) : parseError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Errore durante l&apos;analisi</p>
                  <p className="text-sm text-red-600 mt-1">{parseError}</p>
                </div>
              </div>
            </div>
          ) : companies.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium text-gray-900">
                  File analizzato con successo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-gray-900">{companies.length}</p>
                  <p className="text-sm text-gray-500">Aziende trovate</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {companies.filter((c) => c.existingWebsite).length}
                  </p>
                  <p className="text-sm text-gray-500">Con website esistente</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Carica un file per visualizzare le statistiche
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Preview */}
      {companies.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              3. Anteprima Dati ({companies.length} aziende)
            </h2>
            <button
              onClick={handleProceedToEnrichment}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              Procedi all&apos;Enrichment
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nome Azienda</th>
                    <th>Partita IVA</th>
                    <th>Città</th>
                    <th>Indirizzo</th>
                    <th>Website</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.slice(0, 10).map((company, index) => (
                    <tr key={company.id}>
                      <td className="text-gray-500">{index + 1}</td>
                      <td className="font-medium text-gray-900">{company.name}</td>
                      <td>{company.vatNumber || '-'}</td>
                      <td>{company.city || '-'}</td>
                      <td className="max-w-[200px] truncate">{company.address || '-'}</td>
                      <td>
                        {company.existingWebsite ? (
                          <a
                            href={company.existingWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.existingWebsite}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {companies.length > 10 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
                Mostrando 10 di {companies.length} aziende
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
