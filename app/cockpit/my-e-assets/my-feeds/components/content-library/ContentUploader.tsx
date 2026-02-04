'use client';

import { useState, useRef, DragEvent } from 'react';
import { useFeeds } from '../../context/FeedsContext';

interface ContentUploaderProps {
  feedId?: string;
  onUploadComplete?: () => void;
}

export default function ContentUploader({
  feedId,
  onUploadComplete,
}: ContentUploaderProps) {
  const { uploadFiles, uploadProgress } = useFeeds();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (files.length > 0) {
      await uploadFiles(files, feedId);
      onUploadComplete?.();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files, feedId);
      onUploadComplete?.();
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activeUploads = uploadProgress.filter(
    (p) => p.status === 'uploading' || p.status === 'processing'
  );

  return (
    <div className="content-uploader">
      {/* Drop Zone */}
      <div
        className={`content-uploader-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="content-uploader-input"
        />

        <div className="content-uploader-icon">
          {isDragging ? '📥' : '📤'}
        </div>

        <div className="content-uploader-text">
          {isDragging ? (
            'Drop files here'
          ) : (
            <>
              <span className="content-uploader-action">
                Click to upload
              </span>
              {' or drag and drop'}
            </>
          )}
        </div>

        <div className="content-uploader-hint">
          Images and videos up to 100MB
        </div>
      </div>

      {/* Upload Progress */}
      {activeUploads.length > 0 && (
        <div className="content-uploader-progress">
          {activeUploads.map((upload) => (
            <div key={upload.id} className="upload-progress-item">
              <div className="upload-progress-info">
                <span className="upload-progress-filename">
                  {upload.filename}
                </span>
                <span className="upload-progress-percent">
                  {upload.progress}%
                </span>
              </div>
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
