import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportResult } from '@/hooks/useDataImport';

interface ImportDialogProps {
  isOpen: boolean;
  isImporting: boolean;
  importProgress: number;
  importError: string | null;
  onImport: (file: File, duplicateHandling: 'skip' | 'overwrite') => Promise<ImportResult>;
  onClose: () => void;
}

/**
 * Dialog for importing artifact data
 */
export function ImportDialog({
  isOpen,
  isImporting,
  importProgress,
  importError,
  onImport,
  onClose,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'overwrite'>('skip');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError(null);

    if (selectedFile) {
      if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
        setFileError('Please select a JSON file');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    const importResult = await onImport(file, duplicateHandling);
    setResult(importResult);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
        onClick={!isImporting ? handleClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-xl bg-aged-paper border border-desert-sand shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-desert-sand/50 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-stone-gray" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            result?.success ? 'bg-oxidized-bronze/10' : result ? 'bg-rust-red/10' : 'bg-terracotta/10'
          )}>
            {result?.success ? (
              <CheckCircle className="h-8 w-8 text-oxidized-bronze" />
            ) : result ? (
              <AlertCircle className="h-8 w-8 text-rust-red" />
            ) : (
              <Upload className="h-8 w-8 text-terracotta" />
            )}
          </div>
        </div>

        {/* Content */}
        <h2 className="font-heading text-xl font-semibold text-charcoal text-center mb-4">
          {result ? (result.success ? 'Import Complete!' : 'Import Completed with Errors') : 'Import Data'}
        </h2>

        {/* Result view */}
        {result && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-oxidized-bronze/10">
                <p className="text-2xl font-bold text-oxidized-bronze">{result.imported}</p>
                <p className="text-xs text-stone-gray">Imported</p>
              </div>
              <div className="p-3 rounded-lg bg-gold-ochre/10">
                <p className="text-2xl font-bold text-gold-ochre">{result.skipped}</p>
                <p className="text-xs text-stone-gray">Skipped</p>
              </div>
              <div className="p-3 rounded-lg bg-rust-red/10">
                <p className="text-2xl font-bold text-rust-red">{result.errors.length}</p>
                <p className="text-xs text-stone-gray">Errors</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-rust-red/5 border border-rust-red/20">
                <p className="text-sm font-medium text-rust-red mb-2">Errors:</p>
                <ul className="text-sm text-stone-gray space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-lg bg-terracotta text-bone-white font-medium hover:bg-clay transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Import form */}
        {!result && (
          <>
            {/* File picker */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className={cn(
                  'w-full p-6 rounded-lg border-2 border-dashed transition-colors',
                  file ? 'border-terracotta bg-terracotta/5' : 'border-desert-sand hover:border-terracotta/50 hover:bg-aged-paper'
                )}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    <FileJson className="h-8 w-8 text-terracotta" />
                    <div className="text-left">
                      <p className="font-medium text-charcoal">{file.name}</p>
                      <p className="text-sm text-stone-gray">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-stone-gray mx-auto mb-2" />
                    <p className="font-medium text-charcoal">Select JSON file</p>
                    <p className="text-sm text-stone-gray">or drag and drop</p>
                  </div>
                )}
              </button>
            </div>

            {/* Duplicate handling options */}
            {file && (
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-charcoal">Handle duplicates:</p>
                <label className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  duplicateHandling === 'skip'
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-desert-sand hover:bg-aged-paper'
                )}>
                  <input
                    type="radio"
                    name="duplicateHandling"
                    value="skip"
                    checked={duplicateHandling === 'skip'}
                    onChange={() => setDuplicateHandling('skip')}
                    className="w-4 h-4 text-terracotta"
                  />
                  <div>
                    <p className="font-medium text-charcoal">Skip duplicates</p>
                    <p className="text-xs text-stone-gray">Keep existing artifacts</p>
                  </div>
                </label>
                <label className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  duplicateHandling === 'overwrite'
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-desert-sand hover:bg-aged-paper'
                )}>
                  <input
                    type="radio"
                    name="duplicateHandling"
                    value="overwrite"
                    checked={duplicateHandling === 'overwrite'}
                    onChange={() => setDuplicateHandling('overwrite')}
                    className="w-4 h-4 text-terracotta"
                  />
                  <div>
                    <p className="font-medium text-charcoal">Import as new</p>
                    <p className="text-xs text-stone-gray">Create new entries for all</p>
                  </div>
                </label>
              </div>
            )}

            {/* Progress bar */}
            {isImporting && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-stone-gray mb-2">
                  <span>Importing...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-2 bg-desert-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terracotta transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error messages */}
            {(importError || fileError) && (
              <div className="mb-6 p-3 rounded-lg bg-rust-red/10 border border-rust-red/20">
                <p className="text-sm text-rust-red">{importError || fileError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isImporting}
                className="flex-1 py-3 px-4 rounded-lg border border-desert-sand bg-bone-white text-charcoal font-medium hover:bg-aged-paper transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || isImporting}
                className="flex-1 py-3 px-4 rounded-lg bg-terracotta text-bone-white font-medium hover:bg-clay transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
