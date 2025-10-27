'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, X, Save, Check } from 'lucide-react';
import Image from 'next/image';
import { getImageDisplayUrl, getProxiedImageUrl, hasAuthConfigured } from '@/lib/api/image-proxy';

interface ImageMetadata {
  url: string;
  caption?: string;
  isSelected: boolean;
  order: number;
}

interface ImageEnlargedViewProps {
  isOpen: boolean;
  selectedIndex: number;
  imageMetadata: ImageMetadata[];
  blobUrls?: Map<string, string>;
  fieldName: string;
  onCaptionChange: (index: number, caption: string) => void;
  onSelectionChange: (index: number, checked: boolean) => void;
  onClose: () => void;
  onSelectImage: (index: number) => void;
  onSave: (fieldName: string, images: ImageMetadata[]) => void;
  datasetId?: string;
  imageAuthConfig?: {
    isPrivate: boolean;
    username?: string;
    password?: string;
  };
  cacheVersion?: string | number; // Cache-busting version (dataset updatedAt timestamp)
  failedImageUrls?: Set<string>;
  permanentlyFailedUrls?: Set<string>;
  imageErrors?: Map<string, string>;
  retryingUrls?: Set<string>;
  onImageError?: (imageUrl: string, isProxyUrl?: boolean) => void;
  onRetryImage?: (imageUrl: string) => void;
  onCancelRetry?: (imageUrl: string) => void;
}

export function ImageEnlargedView({
  isOpen,
  selectedIndex,
  imageMetadata,
  blobUrls = new Map(),
  fieldName,
  onCaptionChange,
  onSelectionChange,
  onClose,
  onSelectImage,
  onSave,
  datasetId,
  imageAuthConfig,
  cacheVersion,
  failedImageUrls = new Set(),
  permanentlyFailedUrls = new Set(),
  imageErrors = new Map(),
  retryingUrls = new Set(),
  onImageError,
  onRetryImage,
  onCancelRetry,
}: ImageEnlargedViewProps) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Safety check for selectedIndex bounds
    if (selectedIndex >= 0 && selectedIndex < imageMetadata.length) {
      setCurrentIndex(selectedIndex);
    } else if (imageMetadata.length > 0) {
      // If invalid index but we have images, default to 0
      if (selectedIndex === -1) {
        // Component is closed, don't set currentIndex
        return;
      }
      setCurrentIndex(0);
    }
  }, [selectedIndex, imageMetadata.length]);

  if (!isOpen || imageMetadata.length === 0) return null;

  // Safety check for currentIndex bounds - default to 0 if invalid
  if (currentIndex < 0 || currentIndex >= imageMetadata.length) {
    setCurrentIndex(0);
    return null; // Will re-render with correct index
  }

  const currentImage = imageMetadata[currentIndex];
  
  // Safety check for currentImage existence
  if (!currentImage) {
    return null;
  }

  // Get display URL with smart fallback
  // 1. Prefer blob URL if available
  // 2. If image failed and auth configured, use proxy
  // 3. Otherwise use direct URL
  const baseUrl = blobUrls.get(currentImage.url) || currentImage.url;
  
  let displayUrl = baseUrl;
  let isPermanentlyFailed = false;
  let errorMessage = '';
  
  if (!blobUrls.has(currentImage.url)) {
    const hasFailed = failedImageUrls.has(currentImage.url);
    isPermanentlyFailed = permanentlyFailedUrls.has(currentImage.url);
    const isRetrying = retryingUrls.has(currentImage.url);
    const shouldUseProxy = hasFailed && !isPermanentlyFailed && datasetId && hasAuthConfigured(imageAuthConfig);
    
    displayUrl = shouldUseProxy
      ? getProxiedImageUrl(datasetId!, currentImage.url, cacheVersion)
      : getImageDisplayUrl(datasetId || '', currentImage.url, imageAuthConfig);
    
    errorMessage = imageErrors.get(currentImage.url) || '';
  }

  // Handle successful image load
  const handleImageLoad = (imageUrl: string) => {
    // Remove from retrying state since it succeeded
    // This will be handled by the parent component
  };

  // Handle image load error with proper retry logic
  const handleImageError = (imageUrl: string) => {
    const isProxyUrl = imageUrl.includes('/image-proxy/');
    if (onImageError) {
      onImageError(imageUrl, isProxyUrl);
    }
  };

  // Handle retry with loading state
  const handleRetry = (imageUrl: string) => {
    console.log('Enlarged view retry:', imageUrl);
    // Call the parent retry handler
    if (onRetryImage) {
      onRetryImage(imageUrl);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onSelectImage(newIndex);
    } else if (direction === 'next' && currentIndex < imageMetadata.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onSelectImage(newIndex);
    }
  };

  const handleSave = () => {
    onSave(fieldName, imageMetadata);
  };

  // Mouse event handlers for hover lens effect
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Get natural image dimensions
      const naturalWidth = imageRef.current.naturalWidth || 800;
      const naturalHeight = imageRef.current.naturalHeight || 600;
      
      // Calculate actual image bounds within the container
      const imageAspectRatio = naturalWidth / naturalHeight;
      const containerAspectRatio = rect.width / rect.height;
      
      let imageWidth, imageHeight, imageOffsetX, imageOffsetY;
      
      if (imageAspectRatio > containerAspectRatio) {
        // Image is wider than container - fit to width
        imageWidth = rect.width;
        imageHeight = rect.width / imageAspectRatio;
        imageOffsetX = 0;
        imageOffsetY = (rect.height - imageHeight) / 2;
      } else {
        // Image is taller than container - fit to height
        imageHeight = rect.height;
        imageWidth = rect.height * imageAspectRatio;
        imageOffsetX = (rect.width - imageWidth) / 2;
        imageOffsetY = 0;
      }
      
      // Check if mouse is within actual image bounds
      const isWithinImageBounds = 
        x >= imageOffsetX && 
        x <= imageOffsetX + imageWidth &&
        y >= imageOffsetY && 
        y <= imageOffsetY + imageHeight;
      
      if (isWithinImageBounds) {
        setMousePosition({ x, y });
        setIsMagnifierActive(true);
      } else {
        setIsMagnifierActive(false);
      }
    }
  };

  const handleMouseEnter = () => {
    // Don't set active here - let handleMouseMove determine it
  };

  const handleMouseLeave = () => {
    setIsMagnifierActive(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-[90vw] max-w-6xl h-[85vh] max-h-[800px] bg-white rounded-lg shadow-2xl p-6 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            📸 {fieldName} - Image {currentIndex + 1} of {imageMetadata.length}
          </h2>
          <button
            onClick={onClose}
            data-testid="image-enlarged-view-close-button"
            className="text-gray-600 hover:text-gray-800 bg-white/80 rounded-full p-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main content area */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Image display */}
          <div className="flex-1 flex flex-col items-center min-h-0">
            <div className="relative w-full h-full max-h-[60vh] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {isPermanentlyFailed && !retryingUrls.has(currentImage.url) ? (
                <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                    <div className="text-gray-600 text-lg font-medium mb-2">
                      Image unavailable
                    </div>
                    <div className="text-gray-500 text-sm mb-4">
                      {errorMessage || 'Failed to load image'}
                    </div>
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                        <div className="text-yellow-800 text-sm">
                          💡 <strong>Tip:</strong> Check your authentication credentials in the dataset settings
                        </div>
                      </div>
                      {onRetryImage && (
                        <button
                          onClick={() => handleRetry(currentImage.url)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🔄 Retry Loading Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : retryingUrls.has(currentImage.url) ? (
                <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4 animate-pulse">🖼️</div>
                    <div className="text-gray-600 text-lg font-medium mb-2">
                      Retrying image...
                    </div>
                    <div className="text-gray-500 text-sm mb-4">
                      Please wait while we attempt to reload
                    </div>
                    <div className="h-8 flex items-center justify-center">
                      <button
                        onClick={() => {
                          if (onCancelRetry) {
                            onCancelRetry(currentImage.url);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : displayUrl ? (
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    ref={imageRef}
                    src={displayUrl}
                    alt={`Image ${currentIndex + 1}`}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain cursor-crosshair"
                    unoptimized={true}
                    onLoad={() => handleImageLoad(currentImage.url)}
                    onError={() => handleImageError(currentImage.url)}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Hover Lens Magnifier */}
                  {isMagnifierActive && imageRef.current && (
                    (() => {
                      const imageRect = imageRef.current.getBoundingClientRect();
                      const containerRect = imageRef.current.parentElement?.getBoundingClientRect();
                      if (!containerRect) return null;
                      
                      // Use actual natural image dimensions
                      const naturalWidth = imageRef.current.naturalWidth || 800;
                      const naturalHeight = imageRef.current.naturalHeight || 600;
                      
                      // Calculate the actual rendered image dimensions within the container
                      const imageAspectRatio = naturalWidth / naturalHeight;
                      const containerAspectRatio = containerRect.width / containerRect.height;
                      
                      let imageWidth, imageHeight, imageOffsetX, imageOffsetY;
                      
                      if (imageAspectRatio > containerAspectRatio) {
                        // Image is wider than container - fit to width
                        imageWidth = containerRect.width;
                        imageHeight = containerRect.width / imageAspectRatio;
                        imageOffsetX = 0;
                        imageOffsetY = (containerRect.height - imageHeight) / 2;
                      } else {
                        // Image is taller than container - fit to height
                        imageHeight = containerRect.height;
                        imageWidth = containerRect.height * imageAspectRatio;
                        imageOffsetX = (containerRect.width - imageWidth) / 2;
                        imageOffsetY = 0;
                      }
                      
                      // Calculate relative position within the actual image area
                      const relativeX = (mousePosition.x - imageOffsetX) / imageWidth;
                      const relativeY = (mousePosition.y - imageOffsetY) / imageHeight;
                      
                      // Clamp values to image bounds
                      const clampedX = Math.max(0, Math.min(1, relativeX));
                      const clampedY = Math.max(0, Math.min(1, relativeY));
                      
                      // Calculate magnification (2x)
                      const magnification = 2;
                      
                      // Calculate background position for the magnified view
                      // We need to map the mouse position to the natural image coordinates
                      const naturalX = clampedX * naturalWidth;
                      const naturalY = clampedY * naturalHeight;
                      
                      // Background size should be the natural image size * magnification
                      const bgSize = `${naturalWidth * magnification}px ${naturalHeight * magnification}px`;
                      
                      // Lens size - larger for better visibility
                      const lensSize = 300;
                      const lensRadius = lensSize / 2;
                      
                      // Background position to show the correct magnified area
                      const backgroundX = -(naturalX * magnification - lensRadius);
                      const backgroundY = -(naturalY * magnification - lensRadius);
                      
                      return (
                        <div
                          className="absolute pointer-events-none border-2 border-white rounded-full shadow-lg"
                          style={{
                            width: `${lensSize}px`,
                            height: `${lensSize}px`,
                            left: mousePosition.x - lensRadius,
                            top: mousePosition.y - lensRadius,
                            backgroundImage: `url(${displayUrl})`,
                            backgroundSize: bgSize,
                            backgroundPosition: `${backgroundX}px ${backgroundY}px`,
                            backgroundRepeat: 'no-repeat',
                            zIndex: 10,
                            borderRadius: '50%',
                            border: '4px solid #fff',
                            boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                            transform: 'translateZ(0)', // Hardware acceleration
                          }}
                        />
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading image...</span>
                </div>
              )}
            </div>

            {/* Navigation controls */}
            {imageMetadata.length > 1 && (
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate('prev')}
                  disabled={currentIndex === 0}
                  data-testid="image-enlarged-view-prev-button"
                  className="bg-white/90 hover:bg-white border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="px-4 py-2 bg-white/90 rounded text-sm border border-gray-300">
                  {currentIndex + 1} / {imageMetadata.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate('next')}
                  disabled={currentIndex === imageMetadata.length - 1}
                  data-testid="image-enlarged-view-next-button"
                  className="bg-white/90 hover:bg-white border-gray-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar with controls */}
          <div className="w-80 space-y-4">
            {/* Selection checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentImage.isSelected}
                onChange={(e) => onSelectionChange(currentIndex, e.target.checked)}
                data-testid="image-enlarged-view-select-checkbox"
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium">
                Select this image
              </label>
            </div>

            {/* Caption input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Caption</label>
              <Textarea
                value={currentImage.caption || ''}
                onChange={(e) => onCaptionChange(currentIndex, e.target.value)}
                data-testid="image-enlarged-view-caption-input"
                placeholder="Enter image caption..."
                className="w-full min-h-[100px] resize-y"
                rows={4}
              />
            </div>

            {/* Save button */}
            <div className="pt-2">
              <Button
                onClick={handleSave}
                data-testid="image-enlarged-view-save-button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Annotations
              </Button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
