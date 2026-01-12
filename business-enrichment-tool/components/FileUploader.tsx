'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatFileSize, isValidFileType, getFileType } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadSuccess: boolean;
}

export default function FileUploader({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading,
  uploadProgress,
  uploadError,
  uploadSuccess,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (isValidFileType(file.name)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const getDropzoneClass = () => {
    let baseClass = 'dropzone';
    if (isDragActive && !isDragReject) baseClass += ' active';
    if (isDragReject) baseClass += ' reject';
    return baseClass;
  };

  const getFileIcon = (fileName: string) => {
    const type = getFileType(fileName);
    if (type === 'excel') {
      return <FileSpreadsheet className="w-12 h-12 text-green-600" />;
    }
    return <File className="w-12 h-12 text-red-600" />;
  };

  if (selectedFile && !uploadError) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          {getFileIcon(selectedFile.name)}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{selectedFile.name}</h4>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>

            {isUploading && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Caricamento in corso... {uploadProgress}%
                </p>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-2 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">File caricato con successo</span>
              </div>
            )}
          </div>

          {!isUploading && !uploadSuccess && (
            <button
              onClick={onFileRemove}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Rimuovi file"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div {...getRootProps()} className={getDropzoneClass()}>
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-blue-400'}`} />
          </div>

          {isDragActive && !isDragReject ? (
            <p className="text-blue-600 font-medium">Rilascia il file qui...</p>
          ) : isDragReject ? (
            <p className="text-red-600 font-medium">Formato file non supportato</p>
          ) : (
            <>
              <div className="text-center">
                <p className="text-gray-700 font-medium">
                  Trascina qui il tuo file Excel o PDF
                </p>
                <p className="text-sm text-gray-500 mt-1">oppure</p>
              </div>
              <button
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sfoglia file
              </button>
            </>
          )}

          <p className="text-xs text-gray-400">
            Formati supportati: .xlsx, .xls, .pdf (max 10MB)
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Errore durante il caricamento</p>
            <p className="text-sm text-red-600 mt-1">{uploadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
