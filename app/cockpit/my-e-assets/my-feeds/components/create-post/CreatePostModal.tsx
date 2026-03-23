'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';
import {
  uploadMediaToAllSystems,
  validateMediaFile,
  detectMediaType,
  type UploadResult,
  type UploadProgress,
} from '../../lib/upload-integration';
import EStoragePicker from '../../../my-e-storage/components/EStoragePicker';

interface CreatePostModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

type PostStatus = 'idle' | 'uploading' | 'publishing' | 'success' | 'error';

interface SelectedMedia {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'REELS';
  previewUrl?: string; // local blob URL for preview
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  feed,
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [status, setStatus] = useState<PostStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showEStoragePicker, setShowEStoragePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platform = PLATFORMS[feed.platform];
  const maxCaptionLength = 2200;

  if (!isOpen) return null;

  // ── Drag & Drop handlers ──────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) await handleFileUpload(file);
  };

  // ── File upload handler ───────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = async (file: File) => {
    // Validate first
    const validation = validateMediaFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    setErrorMessage('');
    setStatus('uploading');

    // Show local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    const mediaType = detectMediaType(file.type);

    setSelectedMedia({
      publicUrl: '', // will be set after upload
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      mediaType,
      previewUrl: localPreviewUrl,
    });

    try {
      const result = await uploadMediaToAllSystems(file, {
        feedId: feed.id,
        tags: ['create-post'],
        onProgress: setUploadProgress,
      });

      setSelectedMedia({
        publicUrl: result.publicUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        mediaType: result.mediaType,
        previewUrl: localPreviewUrl,
      });
      setStatus('idle');
      setUploadProgress(null);
    } catch (err: any) {
      console.error('[CreatePost] Upload failed:', err);
      setErrorMessage(err.message || 'Upload failed. Please try again.');
      setSelectedMedia(null);
      setStatus('idle');
      setUploadProgress(null);
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  // ── E-Storage picker handler ──────────────────────────

  const handleEStorageSelect = (items: any[]) => {
    if (items.length === 0) return;
    const item = items[0];

    // If the E-Storage item has a sourceUrl (from Vercel Blob), use it directly
    if (item.sourceUrl) {
      setSelectedMedia({
        publicUrl: item.sourceUrl,
        fileName: item.filename || item.title,
        fileSize: item.fileSize || 0,
        mimeType: item.mimeType || 'image/jpeg',
        mediaType: item.type === 'video' ? 'VIDEO' : 'IMAGE',
      });
      setErrorMessage('');
    } else {
      // Item is only in IndexedDB — needs to be uploaded to get a public URL
      setErrorMessage(
        'This item needs to be uploaded to cloud storage first. ' +
        'Try uploading a file directly instead.'
      );
    }
  };

  // ── URL input handler ─────────────────────────────────

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    const url = urlInput.trim();
    const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);

    setSelectedMedia({
      publicUrl: url,
      fileName: url.split('/').pop() || 'media',
      fileSize: 0,
      mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      previewUrl: isVideo ? undefined : url,
    });
    setShowUrlInput(false);
    setUrlInput('');
    setErrorMessage('');
  };

  // ── Remove media ──────────────────────────────────────

  const handleRemoveMedia = () => {
    if (selectedMedia?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedMedia.previewUrl);
    }
    setSelectedMedia(null);
    setUploadProgress(null);
  };

  // ── Publish / Schedule handlers ───────────────────────

  const handleSchedulePost = async () => {
    if (!caption.trim()) {
      setErrorMessage('Please add a caption');
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      setErrorMessage('Please select a date and time for scheduling');
      return;
    }

    const scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledTime <= new Date()) {
      setErrorMessage('Scheduled time must be in the future');
      return;
    }

    setStatus('publishing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feed_id: feed.id,
          platform: feed.platform,
          content: caption,
          media_urls: selectedMedia?.publicUrl ? [selectedMedia.publicUrl] : [],
          media_type: selectedMedia?.mediaType || 'IMAGE',
          scheduled_time: scheduledTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.post) {
        setStatus('success');
        setPublishedPostId(data.post.id);
        onPostCreated?.();
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to schedule post');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handlePublish = async () => {
    if (scheduleMode) return handleSchedulePost();

    if (!caption.trim() && !selectedMedia) {
      setErrorMessage('Please add a caption or media');
      return;
    }

    if (!selectedMedia?.publicUrl) {
      setErrorMessage('Please upload media or enter an image URL');
      return;
    }

    if (!feed.accessToken) {
      setErrorMessage('No access token available. Please reconnect your account via OAuth.');
      return;
    }

    setStatus('publishing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: feed.accessToken,
          instagram_user_id: feed.platformUserId || feed.id,
          media_url: selectedMedia.publicUrl,
          caption: caption,
          media_type: selectedMedia.mediaType,
        }),
      });

      const data = await response.json();
      if (response.ok && (data.media_id || data.id)) {
        setStatus('success');
        setPublishedPostId(data.media_id || data.id);
        onPostCreated?.();
      } else {
        setStatus('error');
        setErrorMessage(data.error || data.details || 'Failed to publish post');
      }
    } catch (error) {
      console.error('Publish error:', error);
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  // ── Reset / Close ─────────────────────────────────────

  const handleClose = () => {
    handleRemoveMedia();
    setCaption('');
    setStatus('idle');
    setErrorMessage('');
    setPublishedPostId(null);
    setShowUrlInput(false);
    setUrlInput('');
    setUploadProgress(null);
    onClose();
  };

  const handleNewPost = () => {
    handleRemoveMedia();
    setCaption('');
    setStatus('idle');
    setErrorMessage('');
    setPublishedPostId(null);
    setUploadProgress(null);
  };

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div
          className="modal-content create-post-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="modal-header">
            <div className="create-post-title">
              <span
                className="create-post-platform-badge"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon}
              </span>
              <div>
                <h2 className="modal-title">CREATE POST</h2>
                <span className="create-post-handle">{feed.handle}</span>
              </div>
            </div>
            <button type="button" className="modal-close" onClick={handleClose}>
              &times;
            </button>
          </header>

          <div className="modal-body create-post-body">
            {status === 'success' ? (
              <div className="create-post-success">
                <div className="success-icon">{scheduleMode ? '\u{1F4C5}' : '\u{2705}'}</div>
                <h3>{scheduleMode ? 'Post Scheduled!' : 'Post Published!'}</h3>
                <p>
                  {scheduleMode
                    ? `Your post has been scheduled for ${scheduleDate} at ${scheduleTime}.`
                    : 'Your post has been published to Instagram.'}
                </p>
                {publishedPostId && (
                  <p className="post-id">Post ID: {publishedPostId}</p>
                )}
                <div className="success-actions">
                  <button className="modal-button secondary" onClick={handleNewPost}>
                    Create Another
                  </button>
                  <button className="modal-button primary" onClick={handleClose}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ─── MEDIA SECTION ─── */}
                <section className="create-post-section">
                  <h3 className="create-post-section-title">MEDIA</h3>

                  {!selectedMedia ? (
                    <>
                      {/* Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                          border: isDragging
                            ? '2px dashed #3fffdc'
                            : '2px dashed rgba(255, 255, 255, 0.15)',
                          borderRadius: '12px',
                          padding: '2rem 1.5rem',
                          textAlign: 'center',
                          transition: 'all 0.25s ease',
                          background: isDragging
                            ? 'rgba(63, 255, 220, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isDragging ? (
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3fffdc' }}>
                            DROP FILE HERE
                          </span>
                        ) : (
                          <>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.6 }}>
                              {'\u{1F4F7}'}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                              Drag & drop your photo or video
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                              or click to browse files
                            </div>
                          </>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />

                      {/* Action Buttons Row */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        flexWrap: 'wrap',
                      }}>
                        <button
                          className="caption-tool-btn"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={status === 'uploading'}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          {'\u{1F4C1}'} Browse Files
                        </button>
                        <button
                          className="caption-tool-btn"
                          onClick={() => setShowEStoragePicker(true)}
                          disabled={status === 'uploading'}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          {'\u{1F4E6}'} E-Storage
                        </button>
                        <button
                          className="caption-tool-btn"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          disabled={status === 'uploading'}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          {'\u{1F517}'} Use URL
                        </button>
                      </div>

                      {/* Collapsible URL Input */}
                      {showUrlInput && (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '0.5rem',
                          alignItems: 'center',
                        }}>
                          <input
                            type="text"
                            className="media-url-input"
                            placeholder="Paste a public image or video URL..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                            style={{ flex: 1 }}
                          />
                          <button
                            className="modal-button primary"
                            onClick={handleUrlSubmit}
                            disabled={!urlInput.trim()}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ─── Media Preview ─── */
                    <div style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.3)',
                    }}>
                      {/* Preview Image/Video */}
                      {selectedMedia.mimeType.startsWith('video/') ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2rem',
                          gap: '1rem',
                        }}>
                          <span style={{ fontSize: '2.5rem' }}>{'\u{1F3AC}'}</span>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                              {selectedMedia.fileName}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                              {selectedMedia.mediaType} &bull; {formatFileSize(selectedMedia.fileSize)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ maxHeight: '200px', overflow: 'hidden' }}>
                          <img
                            src={selectedMedia.previewUrl || selectedMedia.publicUrl}
                            alt="Preview"
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      )}

                      {/* File info bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}>
                        <div>
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                            {selectedMedia.fileName}
                            {selectedMedia.fileSize > 0 && ` \u2022 ${formatFileSize(selectedMedia.fileSize)}`}
                          </span>
                          {selectedMedia.publicUrl && (
                            <span style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '3px',
                              background: 'rgba(0, 255, 136, 0.15)',
                              color: '#00ff88',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}>
                              Ready
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleRemoveMedia}
                          disabled={status === 'uploading' || status === 'publishing'}
                          style={{
                            background: 'rgba(255, 80, 80, 0.15)',
                            border: '1px solid rgba(255, 80, 80, 0.3)',
                            color: '#ff5050',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          REMOVE
                        </button>
                      </div>

                      {/* Upload progress bar */}
                      {status === 'uploading' && uploadProgress && (
                        <div style={{
                          height: '3px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${uploadProgress.percent}%`,
                            background: 'linear-gradient(90deg, #3fffdc, #00e0ff)',
                            transition: 'width 0.3s ease',
                            borderRadius: '0 2px 2px 0',
                          }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload status message */}
                  {status === 'uploading' && uploadProgress && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#3fffdc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <div className="publishing-spinner" style={{ width: '14px', height: '14px' }} />
                      {uploadProgress.message}
                    </div>
                  )}
                </section>

                {/* ─── CAPTION SECTION ─── */}
                <section className="create-post-section">
                  <div className="create-post-section-header">
                    <h3 className="create-post-section-title">CAPTION</h3>
                    <span className={`caption-counter ${caption.length > maxCaptionLength ? 'over' : ''}`}>
                      {caption.length}/{maxCaptionLength}
                    </span>
                  </div>
                  <textarea
                    className="caption-textarea"
                    placeholder="Write your caption here... Use hashtags and emojis to boost engagement! 🚀"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={status === 'publishing' || status === 'uploading'}
                    rows={6}
                  />
                  <div className="caption-tools">
                    <button
                      className="caption-tool-btn"
                      onClick={() => setCaption(caption + ' #')}
                      disabled={status === 'publishing'}
                    >
                      # Hashtag
                    </button>
                    <button
                      className="caption-tool-btn"
                      onClick={() => setCaption(caption + ' @')}
                      disabled={status === 'publishing'}
                    >
                      @ Mention
                    </button>
                    <button
                      className="caption-tool-btn"
                      onClick={() => setCaption(caption + ' \u{1F525}')}
                      disabled={status === 'publishing'}
                    >
                      {'\u{1F600}'} Emoji
                    </button>
                  </div>
                </section>

                {/* ─── SCHEDULE TOGGLE ─── */}
                <section className="create-post-section">
                  <div className="create-post-section-header">
                    <h3 className="create-post-section-title">PUBLISH MODE</h3>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: scheduleMode ? '0.75rem' : '0',
                  }}>
                    <button
                      className={`modal-button ${!scheduleMode ? 'primary' : 'secondary'}`}
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => setScheduleMode(false)}
                      disabled={status === 'publishing' || status === 'uploading'}
                    >
                      Publish Now
                    </button>
                    <button
                      className={`modal-button ${scheduleMode ? 'primary' : 'secondary'}`}
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
                      onClick={() => setScheduleMode(true)}
                      disabled={status === 'publishing' || status === 'uploading'}
                    >
                      Schedule for Later
                    </button>
                  </div>
                  {scheduleMode && (
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(0, 224, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 224, 255, 0.15)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                          Date
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={status === 'publishing'}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                          Time
                        </label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          disabled={status === 'publishing'}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.875rem',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* ─── ERROR MESSAGE ─── */}
                {errorMessage && (
                  <div className="create-post-error">
                    {'\u26A0\uFE0F'} {errorMessage}
                  </div>
                )}

                {/* ─── PUBLISHING STATUS ─── */}
                {status === 'publishing' && (
                  <div className="create-post-publishing">
                    <div className="publishing-spinner"></div>
                    <span>{scheduleMode ? 'Scheduling...' : 'Publishing to Instagram...'}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {status !== 'success' && (
            <div className="modal-footer">
              <button
                type="button"
                className="modal-button secondary"
                onClick={handleClose}
                disabled={status === 'publishing' || status === 'uploading'}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="modal-button primary"
                onClick={handlePublish}
                disabled={
                  status === 'publishing' ||
                  status === 'uploading' ||
                  (!caption.trim() && !selectedMedia?.publicUrl)
                }
              >
                {status === 'publishing'
                  ? (scheduleMode ? 'SCHEDULING...' : 'PUBLISHING...')
                  : (scheduleMode ? 'SCHEDULE POST' : 'PUBLISH NOW')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* E-Storage Picker Modal */}
      <EStoragePicker
        isOpen={showEStoragePicker}
        onClose={() => setShowEStoragePicker(false)}
        onSelect={handleEStorageSelect}
        multiple={false}
        typeFilter={['image', 'video']}
        maxItems={1}
      />
    </>
  );
};

export default CreatePostModal;
