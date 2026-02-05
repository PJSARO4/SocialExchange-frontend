'use client';

import React, { useState, useRef } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';

interface CreatePostModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

type PostStatus = 'idle' | 'uploading' | 'publishing' | 'success' | 'error';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  feed,
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<PostStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platform = PLATFORMS[feed.platform];
  const maxCaptionLength = 2200;

  if (!isOpen) return null;

  const handleMediaUrlChange = (url: string) => {
    setMediaUrl(url);
    // If it's a valid image URL, show preview
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('unsplash') || url.includes('picsum')) {
      setMediaPreview(url);
    } else {
      setMediaPreview(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just create a preview - actual upload would require a media upload endpoint
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Note: In production, you'd upload to a media server and get back a URL
      setErrorMessage('Note: File uploads require a media server. For now, use an image URL instead.');
    }
  };

  const handlePublish = async () => {
    if (!caption.trim() && !mediaUrl) {
      setErrorMessage('Please add a caption or media URL');
      return;
    }

    if (!mediaUrl) {
      setErrorMessage('Instagram requires an image URL to publish');
      return;
    }

    if (!feed.accessToken) {
      setErrorMessage('No access token available. Please reconnect your account.');
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
          image_url: mediaUrl,
          caption: caption,
          media_type: 'IMAGE',
        }),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        setStatus('success');
        setPublishedPostId(data.id);
        onPostCreated?.();
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to publish post');
      }
    } catch (error) {
      console.error('Publish error:', error);
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleClose = () => {
    setCaption('');
    setMediaUrl('');
    setMediaPreview(null);
    setStatus('idle');
    setErrorMessage('');
    setPublishedPostId(null);
    onClose();
  };

  const handleNewPost = () => {
    setCaption('');
    setMediaUrl('');
    setMediaPreview(null);
    setStatus('idle');
    setErrorMessage('');
    setPublishedPostId(null);
  };

  return (
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
            ×
          </button>
        </header>

        <div className="modal-body create-post-body">
          {status === 'success' ? (
            <div className="create-post-success">
              <div className="success-icon">✅</div>
              <h3>Post Published!</h3>
              <p>Your post has been published to Instagram.</p>
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
              {/* Media Section */}
              <section className="create-post-section">
                <h3 className="create-post-section-title">MEDIA</h3>
                <div className="media-input-group">
                  <input
                    type="text"
                    className="media-url-input"
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    value={mediaUrl}
                    onChange={(e) => handleMediaUrlChange(e.target.value)}
                    disabled={status === 'publishing'}
                  />
                  <span className="media-input-divider">or</span>
                  <button
                    className="media-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={status === 'publishing'}
                  >
                    📁 Upload File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
                {mediaPreview && (
                  <div className="media-preview">
                    <img src={mediaPreview} alt="Preview" />
                    <button
                      className="media-preview-remove"
                      onClick={() => {
                        setMediaPreview(null);
                        setMediaUrl('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </section>

              {/* Caption Section */}
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
                  disabled={status === 'publishing'}
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
                    onClick={() => setCaption(caption + ' 🔥')}
                    disabled={status === 'publishing'}
                  >
                    😀 Emoji
                  </button>
                </div>
              </section>

              {/* Error Message */}
              {errorMessage && (
                <div className="create-post-error">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Publishing Status */}
              {status === 'publishing' && (
                <div className="create-post-publishing">
                  <div className="publishing-spinner"></div>
                  <span>Publishing to Instagram...</span>
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
              disabled={status === 'publishing'}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="modal-button primary"
              onClick={handlePublish}
              disabled={status === 'publishing' || (!caption.trim() && !mediaUrl)}
            >
              {status === 'publishing' ? 'PUBLISHING...' : 'PUBLISH NOW'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;
