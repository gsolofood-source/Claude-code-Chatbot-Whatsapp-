'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/DataTable';
import ExportButton from '@/components/ExportButton';
import {
  BarChart3,
  Instagram,
  Globe,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { EnrichedCompany } from '@/types';

export default function ResultsPage() {
  const router = useRouter();
  const [enrichedCompanies, setEnrichedCompanies] = useState<EnrichedCompany[]>([]);
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    // Load enriched data from localStorage
    const storedResults = localStorage.getItem('enrichment_results');
    if (storedResults) {
      setEnrichedCompanies(JSON.parse(storedResults));
    }

    // Get original file name
    const fileData = localStorage.getItem('enrichment_file');
    if (fileData) {
      const { fileName: name } = JSON.parse(fileData);
      setFileName(name);
    }
  }, []);

  const stats = useMemo(() => {
    const total = enrichedCompanies.length;
    if (total === 0) return null;

    const instagramFound = enrichedCompanies.filter((c) => c.instagramUrl).length;
    const websiteFound = enrichedCompanies.filter((c) => c.verifiedWebsite).length;
    const mapsFound = enrichedCompanies.filter((c) => c.googleMapsUrl).length;
    const complete = enrichedCompanies.filter((c) => c.enrichmentStatus === 'complete').length;
    const partial = enrichedCompanies.filter((c) => c.enrichmentStatus === 'partial').length;
    const notFound = enrichedCompanies.filter((c) => c.enrichmentStatus === 'not_found').length;

    return {
      total,
      instagramFound,
      instagramPercentage: Math.round((instagramFound / total) * 100),
      websiteFound,
      websitePercentage: Math.round((websiteFound / total) * 100),
      mapsFound,
      mapsPercentage: Math.round((mapsFound / total) * 100),
      complete,
      completePercentage: Math.round((complete / total) * 100),
      partial,
      partialPercentage: Math.round((partial / total) * 100),
      notFound,
      notFoundPercentage: Math.round((notFound / total) * 100),
    };
  }, [enrichedCompanies]);

  if (enrichedCompanies.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Nessun Risultato Disponibile
          </h1>
          <p className="text-gray-600 mb-6">
            Non sono stati trovati dati arricchiti. Esegui prima l&apos;enrichment.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Vai all&apos;Upload
            </button>
            <button
              onClick={() => router.push('/enrichment')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Vai all&apos;Enrichment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Risultati Enrichment
          </h1>
          <p className="text-gray-600">
            {stats?.total} aziende processate
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/enrichment')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Riesegui
          </button>
          <ExportButton data={enrichedCompanies} fileName={fileName} />
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Overall Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Totale</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.total}</p>
          <p className="text-sm text-gray-500">aziende processate</p>
        </div>

        {/* Instagram */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Instagram className="w-5 h-5 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Instagram</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.instagramFound}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${stats?.instagramPercentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{stats?.instagramPercentage}%</span>
          </div>
        </div>

        {/* Website */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Siti Web</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.websiteFound}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${stats?.websitePercentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{stats?.websitePercentage}%</span>
          </div>
        </div>

        {/* Google Maps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Google Maps</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.mapsFound}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${stats?.mapsPercentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{stats?.mapsPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Riepilogo Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.complete}</p>
              <p className="text-sm text-gray-600">Completo ({stats?.completePercentage}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <MinusCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.partial}</p>
              <p className="text-sm text-gray-600">Parziale ({stats?.partialPercentage}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.notFound}</p>
              <p className="text-sm text-gray-600">Non Trovato ({stats?.notFoundPercentage}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Dettaglio Risultati</h3>
        <DataTable data={enrichedCompanies} />
      </div>
    </div>
  );
}
