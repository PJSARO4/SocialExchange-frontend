'use client';

import { useRef, useState } from 'react';

interface UploadedContent {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  uploadedAt: Date;
}

interface Props {
  onUpload: (files: File[]) => void;
  contentQueue: UploadedContent[];
}

export default function ContentUploader({
  onUpload,
  contentQueue,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    onUpload(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;
    handleFiles(Array.from(e.target.files));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeGlyph = (type: UploadedContent['type']) => {
    switch (type) {
      case 'image':
        return '▣';
      case 'video':
        return '▶';
      case 'audio':
        return '♪';
      default:
        return '◆';
    }
  };

  return (
    <div className="content-uploader">
      <div
        className={`content-upload-zone ${
          isDragging ? 'dragging' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="content-upload-icon">↑</div>
        <div className="content-upload-text">
          DROP FILES OR CLICK TO INGEST
        </div>
        <div className="content-upload-formats">
          IMAGE • VIDEO • AUDIO • DOCUMENT
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {contentQueue.length > 0 && (
        <div className="content-queue">
          <div className="content-queue-header">
            QUEUED CONTENT
          </div>

          <div className="content-queue-list">
            {contentQueue.map((item) => (
              <div
                key={item.id}
                className="content-queue-item"
              >
                <span className="content-queue-icon">
                  {typeGlyph(item.type)}
                </span>
                <span className="content-queue-name">
                  {item.name}
                </span>
                <span className="content-queue-size">
                  {formatSize(item.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
