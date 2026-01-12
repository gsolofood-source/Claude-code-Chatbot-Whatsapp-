'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  ExternalLink,
  Instagram,
  Globe,
  MapPin,
  ChevronUp,
  ChevronDown,
  Filter,
} from 'lucide-react';
import type { EnrichedCompany, EnrichmentStatus } from '@/types';

interface DataTableProps {
  data: EnrichedCompany[];
}

type SortField = 'name' | 'city' | 'enrichmentStatus';
type SortOrder = 'asc' | 'desc';

const statusConfig: Record<
  EnrichmentStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  complete: { label: 'Completo', icon: CheckCircle, color: 'text-green-600' },
  partial: { label: 'Parziale', icon: MinusCircle, color: 'text-yellow-600' },
  not_found: { label: 'Non Trovato', icon: XCircle, color: 'text-red-600' },
  pending: { label: 'In Attesa', icon: MinusCircle, color: 'text-gray-400' },
  processing: { label: 'In Elaborazione', icon: MinusCircle, color: 'text-blue-600' },
};

export default function DataTable({ data }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<EnrichmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.enrichmentStatus === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.city?.toLowerCase().includes(term) ||
          item.vatNumber?.includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'enrichmentStatus':
          comparison = a.enrichmentStatus.localeCompare(b.enrichmentStatus);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, sortField, sortOrder, statusFilter, searchTerm]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Cerca azienda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EnrichmentStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutti gli stati</option>
            <option value="complete">Completo</option>
            <option value="partial">Parziale</option>
            <option value="not_found">Non Trovato</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Azienda
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('city')}
                    className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Città
                    <SortIcon field="city" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    Instagram
                  </span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Website
                  </span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Maps
                  </span>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('enrichmentStatus')}
                    className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Status
                    <SortIcon field="enrichmentStatus" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((company) => {
                const statusInfo = statusConfig[company.enrichmentStatus];
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={company.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        {company.vatNumber && (
                          <p className="text-xs text-gray-500">P.IVA: {company.vatNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{company.city || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {company.instagramUrl ? (
                        <a
                          href={company.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-pink-600 hover:underline"
                        >
                          {company.instagramHandle || 'Link'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {company.verifiedWebsite ? (
                        <a
                          href={company.verifiedWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {company.googleMapsUrl ? (
                        <a
                          href={company.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:underline"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedData.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nessun risultato trovato
          </div>
        )}

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Mostrando {filteredAndSortedData.length} di {data.length} aziende
        </div>
      </div>
    </div>
  );
}
