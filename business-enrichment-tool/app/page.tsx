'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import { CheckCircle, Instagram, Globe, MapPin, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setFileId(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress
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

      // Store file info in localStorage for other pages
      localStorage.setItem(
        'enrichment_file',
        JSON.stringify({
          fileId: data.fileId,
          fileName: data.fileName,
          rowCount: data.rowCount,
        })
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProceed = () => {
    router.push('/upload');
  };

  const features = [
    {
      icon: Instagram,
      title: 'Profili Instagram',
      description: 'Trova automaticamente i profili Instagram delle aziende',
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
    {
      icon: Globe,
      title: 'Siti Web Ufficiali',
      description: 'Identifica e verifica i siti web aziendali',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: 'Google My Business',
      description: 'Recupera i link a Google Maps per ogni azienda',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Business Enrichment Tool
        </h1>
        <p className="text-lg text-gray-600">
          Arricchisci i tuoi dati aziendali con informazioni di contatto e presenza online
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 border border-gray-200 card-hover"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Carica il tuo file
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
      </div>

      {/* Actions */}
      {selectedFile && !uploadSuccess && (
        <div className="flex justify-center">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                Carica File
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex justify-center">
          <button
            onClick={handleProceed}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Procedi al Parsing
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Come funziona</h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
              1
            </span>
            <span className="text-gray-600">
              Carica un file Excel o PDF contenente i dati aziendali (export Creditsafe)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
              2
            </span>
            <span className="text-gray-600">
              Il sistema estrae automaticamente Nome Azienda, Partita IVA e Città
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
              3
            </span>
            <span className="text-gray-600">
              Avvia l&apos;enrichment per trovare Instagram, Sito Web e Google Maps
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
              4
            </span>
            <span className="text-gray-600">
              Scarica il file Excel arricchito con tutti i nuovi dati
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
