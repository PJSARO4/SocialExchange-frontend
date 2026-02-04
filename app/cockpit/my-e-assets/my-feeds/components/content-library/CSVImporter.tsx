'use client';

import { useState, useRef } from 'react';
import { useFeeds } from '../../context/FeedsContext';
import { CSVImportResult } from '../../types/content';

interface CSVImporterProps {
  feedId?: string;
  onImportComplete?: (result: CSVImportResult) => void;
  onClose: () => void;
}

export default function CSVImporter({
  feedId,
  onImportComplete,
  onClose,
}: CSVImporterProps) {
  const { importCSV, contentLoading } = useFeeds();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setError(null);
    try {
      const importResult = await importCSV(selectedFile, feedId);
      setResult(importResult);
      onImportComplete?.(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content csv-importer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">IMPORT FROM CSV</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={contentLoading}
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          {/* Instructions */}
          <div className="csv-importer-instructions">
            <h3>CSV FORMAT</h3>
            <p>Your CSV should include these columns:</p>
            <div className="csv-importer-columns">
              <span className="csv-column required">title</span>
              <span className="csv-column">caption</span>
              <span className="csv-column">hashtags</span>
              <span className="csv-column">mediaUrl</span>
              <span className="csv-column">tags</span>
            </div>
            <p className="csv-importer-note">
              First row should be the header. Hashtags and tags can be comma or semicolon separated.
            </p>
          </div>

          {/* File Selection */}
          {!result && (
            <div className="csv-importer-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="csv-importer-input"
              />

              {selectedFile ? (
                <div className="csv-importer-selected">
                  <div className="csv-importer-file">
                    <span className="csv-importer-file-icon">📄</span>
                    <span className="csv-importer-file-name">
                      {selectedFile.name}
                    </span>
                    <span className="csv-importer-file-size">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <button
                    className="csv-importer-change"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={contentLoading}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div
                  className="csv-importer-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="csv-importer-dropzone-icon">📁</span>
                  <span className="csv-importer-dropzone-text">
                    Click to select CSV file
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="csv-importer-error">
              <span className="csv-importer-error-icon">⚠</span>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`csv-importer-result ${result.success ? 'success' : 'partial'}`}>
              <div className="csv-importer-result-header">
                <span className="csv-importer-result-icon">
                  {result.success ? '✓' : '⚠'}
                </span>
                <span className="csv-importer-result-title">
                  {result.success ? 'Import Complete' : 'Import Completed with Errors'}
                </span>
              </div>

              <div className="csv-importer-result-stats">
                <div className="csv-importer-stat">
                  <span className="csv-importer-stat-value">{result.totalRows}</span>
                  <span className="csv-importer-stat-label">Total Rows</span>
                </div>
                <div className="csv-importer-stat success">
                  <span className="csv-importer-stat-value">{result.importedCount}</span>
                  <span className="csv-importer-stat-label">Imported</span>
                </div>
                {result.skippedCount > 0 && (
                  <div className="csv-importer-stat error">
                    <span className="csv-importer-stat-value">{result.skippedCount}</span>
                    <span className="csv-importer-stat-label">Skipped</span>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="csv-importer-errors">
                  <h4>Errors</h4>
                  <ul>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="csv-importer-errors-more">
                        ...and {result.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {result ? (
            <>
              <button
                className="modal-button secondary"
                onClick={handleReset}
              >
                IMPORT ANOTHER
              </button>
              <button
                className="modal-button primary"
                onClick={onClose}
              >
                DONE
              </button>
            </>
          ) : (
            <>
              <button
                className="modal-button secondary"
                onClick={onClose}
                disabled={contentLoading}
              >
                CANCEL
              </button>
              <button
                className="modal-button primary"
                onClick={handleImport}
                disabled={!selectedFile || contentLoading}
              >
                {contentLoading ? 'IMPORTING...' : 'IMPORT'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
