'use client';

import {
  CheckCircle,
  XCircle,
  Loader2,
  Instagram,
  Globe,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import type { EnrichmentProgress } from '@/types';

interface CompanyCardProps {
  progress: EnrichmentProgress;
}

export default function CompanyCard({ progress }: CompanyCardProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'searching':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'found':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'not_found':
        return <XCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBg = () => {
    switch (progress.status) {
      case 'searching':
        return 'bg-blue-50 border-blue-200';
      case 'found':
        return 'bg-green-50 border-green-200';
      case 'not_found':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusBg()} animate-slide-up`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">{progress.companyName}</span>
        </div>
      </div>

      {progress.status === 'searching' && (
        <p className="mt-2 text-sm text-blue-600">Ricerca in corso...</p>
      )}

      {progress.status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{progress.error}</p>
      )}

      {(progress.status === 'found' || progress.status === 'not_found') && (
        <div className="mt-3 space-y-2">
          {/* Instagram */}
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-600" />
            {progress.instagram?.found ? (
              <a
                href={progress.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {progress.instagram.handle}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-sm text-gray-400">Non trovato</span>
            )}
          </div>

          {/* Website */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            {progress.website?.found ? (
              <a
                href={progress.website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[250px]"
              >
                {progress.website.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-sm text-gray-400">Non trovato</span>
            )}
          </div>

          {/* Google Maps */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            {progress.googleMaps?.found ? (
              <a
                href={progress.googleMaps.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-sm text-gray-400">Non trovato</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
