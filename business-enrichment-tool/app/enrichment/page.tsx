'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/ProgressBar';
import CompanyCard from '@/components/CompanyCard';
import {
  Play,
  Pause,
  StopCircle,
  ArrowRight,
  AlertCircle,
  Settings,
  Instagram,
  Globe,
  MapPin,
} from 'lucide-react';
import type { Company, EnrichedCompany, EnrichmentProgress, EnrichmentOptions } from '@/types';

export default function EnrichmentPage() {
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [enrichedCompanies, setEnrichedCompanies] = useState<EnrichedCompany[]>([]);
  const [progressList, setProgressList] = useState<EnrichmentProgress[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    instagram: 0,
    website: 0,
    googleMaps: 0,
  });

  const [options, setOptions] = useState<EnrichmentOptions>({
    searchInstagram: true,
    searchWebsite: true,
    searchGoogleMaps: true,
    delayBetweenRequests: 1500,
  });

  const [showSettings, setShowSettings] = useState(false);

  // Load companies from localStorage
  useEffect(() => {
    const storedCompanies = localStorage.getItem('enrichment_companies');
    if (storedCompanies) {
      const parsed = JSON.parse(storedCompanies);
      setCompanies(parsed);
      // Initialize enriched companies with pending status
      setEnrichedCompanies(
        parsed.map((c: Company) => ({
          ...c,
          enrichmentStatus: 'pending' as const,
          enrichmentDate: '',
        }))
      );
    }
  }, []);

  const startEnrichment = useCallback(async () => {
    if (companies.length === 0) {
      setError('Nessuna azienda da elaborare. Carica prima un file.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
    setError(null);
    setProgressList([]);
    setStats({ instagram: 0, website: 0, googleMaps: 0 });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies,
          options,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'enrichment');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossibile leggere la risposta');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Check for completion
              if (data.type === 'complete') {
                setIsComplete(true);
                setIsRunning(false);
                // Store enriched data
                localStorage.setItem(
                  'enrichment_results',
                  JSON.stringify(enrichedCompanies)
                );
                continue;
              }

              // Check for error
              if (data.type === 'error') {
                setError(data.error);
                setIsRunning(false);
                continue;
              }

              // Update progress
              const progress = data as EnrichmentProgress;
              setCurrentIndex(
                companies.findIndex((c) => c.id === progress.companyId) + 1
              );

              // Update progress list (keep last 10)
              setProgressList((prev) => {
                const filtered = prev.filter((p) => p.companyId !== progress.companyId);
                const updated = [...filtered, progress];
                return updated.slice(-10);
              });

              // Update stats
              if (progress.status === 'found' || progress.status === 'not_found') {
                setStats((prev) => ({
                  instagram: prev.instagram + (progress.instagram?.found ? 1 : 0),
                  website: prev.website + (progress.website?.found ? 1 : 0),
                  googleMaps: prev.googleMaps + (progress.googleMaps?.found ? 1 : 0),
                }));

                // Update enriched companies
                setEnrichedCompanies((prev) =>
                  prev.map((c) =>
                    c.id === progress.companyId
                      ? {
                          ...c,
                          instagramUrl: progress.instagram?.url,
                          instagramHandle: progress.instagram?.handle,
                          verifiedWebsite: progress.website?.url,
                          googleMapsUrl: progress.googleMaps?.url,
                          enrichmentStatus: determineStatus(progress),
                          enrichmentDate: new Date().toISOString(),
                        }
                      : c
                  )
                );
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Enrichment annullato');
      } else {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      }
      setIsRunning(false);
    }
  }, [companies, options, enrichedCompanies]);

  const stopEnrichment = () => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsPaused(false);
  };

  const determineStatus = (progress: EnrichmentProgress): 'complete' | 'partial' | 'not_found' => {
    const found = [
      progress.instagram?.found,
      progress.website?.found,
      progress.googleMaps?.found,
    ].filter(Boolean).length;

    if (found === 3) return 'complete';
    if (found > 0) return 'partial';
    return 'not_found';
  };

  const goToResults = () => {
    // Store final results
    localStorage.setItem('enrichment_results', JSON.stringify(enrichedCompanies));
    router.push('/results');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Enrichment Dati
          </h1>
          <p className="text-gray-600">
            {companies.length} aziende da elaborare
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Opzioni Enrichment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.searchInstagram}
                  onChange={(e) =>
                    setOptions({ ...options, searchInstagram: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={isRunning}
                />
                <Instagram className="w-5 h-5 text-pink-600" />
                <span>Cerca Instagram</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.searchWebsite}
                  onChange={(e) =>
                    setOptions({ ...options, searchWebsite: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={isRunning}
                />
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Cerca Sito Web</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={options.searchGoogleMaps}
                  onChange={(e) =>
                    setOptions({ ...options, searchGoogleMaps: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={isRunning}
                />
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Cerca Google Maps</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay tra ricerche (ms)
              </label>
              <input
                type="number"
                value={options.delayBetweenRequests}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    delayBetweenRequests: parseInt(e.target.value) || 1500,
                  })
                }
                min={500}
                max={5000}
                step={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isRunning}
              />
              <p className="text-xs text-gray-500 mt-1">
                Aumenta per evitare rate limiting (min 500ms)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Errore</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Section */}
      {(isRunning || isComplete) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="mb-6">
            <ProgressBar
              current={currentIndex}
              total={companies.length}
              label="Progresso Enrichment"
              color={isComplete ? 'green' : 'blue'}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-pink-50 rounded-lg p-4 text-center">
              <Instagram className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.instagram}</p>
              <p className="text-xs text-gray-500">Instagram trovati</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Globe className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.website}</p>
              <p className="text-xs text-gray-500">Siti web trovati</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.googleMaps}</p>
              <p className="text-xs text-gray-500">Google Maps trovati</p>
            </div>
          </div>

          {/* Progress List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {progressList.map((progress) => (
              <CompanyCard key={progress.companyId} progress={progress} />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRunning && !isComplete && (
          <button
            onClick={startEnrichment}
            disabled={companies.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Avvia Enrichment
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-8 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              {isPaused ? 'Riprendi' : 'Pausa'}
            </button>
            <button
              onClick={stopEnrichment}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <StopCircle className="w-5 h-5" />
              Annulla
            </button>
          </>
        )}

        {isComplete && (
          <button
            onClick={goToResults}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            Vai ai Risultati
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* No Companies Message */}
      {companies.length === 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-800 font-medium">Nessuna azienda caricata</p>
          <p className="text-sm text-yellow-600 mt-2">
            Vai alla pagina Upload per caricare un file con i dati aziendali.
          </p>
          <button
            onClick={() => router.push('/upload')}
            className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Vai all&apos;Upload
          </button>
        </div>
      )}
    </div>
  );
}
