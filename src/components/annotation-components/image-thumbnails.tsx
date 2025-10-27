'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { ImageEnlargedView } from './image-enlarged-view';
import { AnnotationsAPI } from '@/lib/api/annotations';
import { getImageDisplayUrl, getProxiedImageUrl, hasAuthConfigured } from '@/lib/api/image-proxy';

interface ImageMetadata {
  url: string;
  caption?: string;
  isSelected: boolean;
  order: number;
}

interface ImageThumbnailsProps {
  imageUrls: string | string[];
  columnName?: string;
  onImageClick?: (imageUrls: string[], index: number, fieldName?: string) => void;
  maxDisplay?: number;
  className?: string;
  datasetId?: string;
  rowIndex?: number;
  fieldName?: string;
  imageAuthConfig?: {
    isPrivate: boolean;
    username?: string;
    password?: string;
  };
  cacheVersion?: string | number; // Cache-busting version (dataset updatedAt timestamp)
}

export function ImageThumbnails({
  imageUrls,
  columnName,
  onImageClick,
  maxDisplay = 4,
  className = '',
  datasetId,
  rowIndex,
  fieldName,
  imageAuthConfig,
  cacheVersion,
}: ImageThumbnailsProps) {
  const { showToast } = useToast();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata[]>([]);
  const [showEnlargedView, setShowEnlargedView] = useState(false);
  const [enlargedIndex, setEnlargedIndex] = useState(-1);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());
  const [permanentlyFailedUrls, setPermanentlyFailedUrls] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Map<string, string>>(new Map());
  const [hasShownAuthError, setHasShownAuthError] = useState(false);
  const [retryingUrls, setRetryingUrls] = useState<Set<string>>(new Set());


  // Memoize URL parsing to prevent unnecessary recalculations
  const parsedUrls = useMemo(() => {
    // Handle both string and string array inputs
    const urls = Array.isArray(imageUrls) 
      ? imageUrls 
      : imageUrls.split(/[,\n]/); // Handle both comma and newline separators
    
    return urls
      .map((url) => url.trim())
      .filter((url) => url && url.startsWith('http'));
  }, [imageUrls]);

  // Initialize image metadata when URLs change
  useEffect(() => {
    const normalized: ImageMetadata[] = parsedUrls.map((url, index) => ({
      url,
      caption: '',
      isSelected: false,
      order: index,
    }));
    setImageMetadata(normalized);
  }, [parsedUrls]);

  // Load existing annotations from backend
  useEffect(() => {
    // Reset to empty state first when row changes
    const normalized: ImageMetadata[] = parsedUrls.map((url, index) => ({
      url,
      caption: '',
      isSelected: false,
      order: index,
    }));
    setImageMetadata(normalized);

    const loadExistingAnnotations = async () => {
      if (!datasetId || rowIndex === undefined || !fieldName || parsedUrls.length === 0) {
        return;
      }

      try {
        const annotation = await AnnotationsAPI.getRowFieldAnnotation(
          datasetId,
          rowIndex,
          fieldName
        );

        if (annotation && annotation.images && annotation.images.length > 0) {
          console.log('📥 Loaded existing annotations:', annotation);
          
          // Merge existing annotations with current URLs
          const mergedMetadata = parsedUrls.map((url, index) => {
            const existingImage = annotation.images.find(img => img.url === url);
            return existingImage || {
              url,
              caption: '',
              isSelected: false,
              order: index,
            };
          });
          
          setImageMetadata(mergedMetadata);
        }
      } catch (error) {
        console.log('ℹ️ No existing annotations found or error loading:', error);
      }
    };

    loadExistingAnnotations();
  }, [datasetId, rowIndex, fieldName, parsedUrls]);

  const handleImageClick = (index: number) => {
    // Safety check for index bounds
    if (index < 0 || index >= parsedUrls.length) {
      console.warn(`Invalid image index: ${index}, parsedUrls.length: ${parsedUrls.length}`);
      return;
    }
    
    setSelectedIndex(index);
    setEnlargedIndex(index);
    setShowEnlargedView(true);
    if (onImageClick) {
      onImageClick(parsedUrls, index, fieldName);
    }
  };

  const handleEnlargedImageSelect = (index: number) => {
    // Safety check for index bounds
    if (index < 0 || index >= imageMetadata.length) {
      console.warn(`Invalid enlarged image index: ${index}, imageMetadata.length: ${imageMetadata.length}`);
      return;
    }
    
    setEnlargedIndex(index);
    setSelectedIndex(index);
  };

  const handleCloseEnlargedView = () => {
    setShowEnlargedView(false);
    setEnlargedIndex(-1);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updatedMetadata = imageMetadata.map((img, i) => 
      i === index 
        ? { ...img, caption, isSelected: caption.trim() !== '' ? true : img.isSelected }
        : img
    );
    setImageMetadata(updatedMetadata);
  };

  const handleSelectionChange = (index: number, checked: boolean) => {
    const updatedMetadata = imageMetadata.map((img, i) => 
      i === index ? { ...img, isSelected: checked } : img
    );
    setImageMetadata(updatedMetadata);
  };

  // Handle cancel retry
  const handleCancelRetry = (imageUrl: string) => {
    console.log('Cancelling retry for:', imageUrl);
    setRetryingUrls(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    setPermanentlyFailedUrls(prev => new Set([...prev, imageUrl]));
    setImageErrors(prev => new Map([...prev, [imageUrl, 'Retry cancelled']]));
  };

  // Handle image load error with proper retry logic
  const handleRetryImage = (imageUrl: string) => {
    console.log('Retrying image:', imageUrl);
    console.log('Dataset ID:', datasetId);
    console.log('Auth configured:', hasAuthConfigured(imageAuthConfig));
    
    // Add to retrying state
    setRetryingUrls(prev => new Set([...prev, imageUrl]));
    
    // Reset error states for this image
    setFailedImageUrls(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    setPermanentlyFailedUrls(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    setImageErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(imageUrl);
      return newMap;
    });

    // Force the image to use proxy if auth is configured
    if (datasetId && hasAuthConfigured(imageAuthConfig)) {
      console.log('Forcing proxy URL for retry');
      // Add to failed URLs to trigger proxy usage
      setFailedImageUrls(prev => {
        const newSet = new Set([...prev, imageUrl]);
        console.log('Updated failedImageUrls:', Array.from(newSet));
        return newSet;
      });
      
      // Test the proxy URL directly with fetch to detect errors
      const proxyUrl = getProxiedImageUrl(datasetId, imageUrl, cacheVersion);
      console.log('Testing proxy URL with fetch:', proxyUrl);
      
      fetch(proxyUrl)
        .then(response => {
          console.log('Proxy fetch response:', response.status, response.statusText);
          if (!response.ok) {
            // If fetch fails, trigger the error handler
            handleImageError(imageUrl, true);
          }
        })
        .catch(error => {
          console.log('Proxy fetch error:', error);
          // If fetch fails, trigger the error handler
          handleImageError(imageUrl, true);
        });
    }

    // Add timeout to clear retrying state if no response
    setTimeout(() => {
      setRetryingUrls(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageUrl)) {
          console.log('Retry timeout for:', imageUrl);
          newSet.delete(imageUrl);
          // Mark as permanently failed if still retrying after timeout
          setPermanentlyFailedUrls(prevFailed => new Set([...prevFailed, imageUrl]));
          setImageErrors(prevErrors => new Map([...prevErrors, [imageUrl, 'Request timeout - please try again']]));
        }
        return newSet;
      });
    }, 15000); // Increased to 15 second timeout
  };

  // Handle successful image load
  const handleImageLoad = (imageUrl: string) => {
    console.log('Image loaded successfully:', imageUrl);
    // Remove from retrying state since it succeeded
    setRetryingUrls(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
  };

  const handleImageError = (imageUrl: string, isProxyUrl: boolean = false) => {
    console.log('Image error:', imageUrl, 'isProxyUrl:', isProxyUrl);
    // Remove from retrying state since it failed
    setRetryingUrls(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
    
    // If this is a proxy URL that failed, mark as permanently failed
    if (isProxyUrl || imageUrl.includes('/image-proxy/')) {
      setPermanentlyFailedUrls(prev => new Set([...prev, imageUrl]));
      setImageErrors(prev => new Map([...prev, [imageUrl, 'Authentication failed - please check your credentials']]));
      
      // Show red error toast when retry fails
      showToast({
        type: 'error',
        title: 'Image Load Failed',
        description: 'Authentication failed - please check your credentials'
      });
      return;
    }
    
    // If already permanently failed, don't retry
    if (permanentlyFailedUrls.has(imageUrl)) {
      return;
    }
    
    // If this is the first failure and auth is configured, try proxy
    if (datasetId && hasAuthConfigured(imageAuthConfig) && !failedImageUrls.has(imageUrl)) {
      setFailedImageUrls(prev => new Set([...prev, imageUrl]));
    } else {
      // If direct URL failed and no auth configured, or already tried proxy, mark as permanently failed
      setPermanentlyFailedUrls(prev => new Set([...prev, imageUrl]));
      setImageErrors(prev => new Map([...prev, [imageUrl, 'Image failed to load']]));
      
      // Show red error toast when retry fails
      showToast({
        type: 'error',
        title: 'Image Load Failed',
        description: 'Unable to load image. Please check the URL or try again.'
      });
    }
  };

  const handleSaveAnnotations = async (fieldName: string, images: ImageMetadata[]) => {
    if (!datasetId || rowIndex === undefined) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Missing dataset ID or row index'
      });
      return;
    }

    try {
      console.log('💾 Saving image metadata:', {
        datasetId,
        rowIndex,
        fieldName,
        imagesCount: images.length,
        images: images.map(img => ({ 
          url: img.url.substring(0, 50) + '...', 
          caption: img.caption, 
          isSelected: img.isSelected 
        }))
      });

      // Call the API to save annotations
      const response = await AnnotationsAPI.saveImageMetadata({
        datasetId,
        rowIndex,
        fieldName,
        images,
        isAiGenerated: false,
      });

      console.log('✅ Saved annotation:', response);
      
      showToast({
        type: 'success',
        title: 'Saved',
        description: `Successfully saved ${images.filter(img => img.isSelected).length} selected image annotation(s)`
      });
      
      setImageMetadata(images); // Update local state
    } catch (error: any) {
      console.error('❌ Failed to save annotations:', error);
      showToast({
        type: 'error',
        title: 'Failed to save',
        description: error.response?.data?.message || 'An error occurred while saving annotations'
      });
    }
  };

  if (parsedUrls.length === 0) {
    return (
      <div className={`p-3 border border-gray-200 rounded-md bg-white text-sm text-gray-500 text-center ${className}`}>
        No images found
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        📸 {columnName ? `${columnName} Images` : 'Images'} ({parsedUrls.length})
      </Label>
      
      <div className={`grid gap-2 transition-all duration-300 ${
        showEnlargedView ? 'grid-cols-6' : 'grid-cols-2'
      }`} data-testid="image-thumbnails-grid">
        {parsedUrls.map((url, index) => {
          const trimmedUrl = url.trim();
          if (
            !trimmedUrl ||
            trimmedUrl === '[object Object]' ||
            !trimmedUrl.startsWith('http')
          ) {
            return null;
          }

          const metadata = imageMetadata[index] || { url: trimmedUrl, caption: '', isSelected: false, order: index };
          
          // Get display URL with smart fallback
          // 1. Try direct URL first
          // 2. If failed and auth configured, use proxy
          // 3. If proxy also failed, show error
          const hasFailed = failedImageUrls.has(trimmedUrl);
          const isPermanentlyFailed = permanentlyFailedUrls.has(trimmedUrl);
          const isRetrying = retryingUrls.has(trimmedUrl);
          const shouldUseProxy = Boolean(hasFailed && !isPermanentlyFailed && datasetId && hasAuthConfigured(imageAuthConfig));
          
          const displayUrl = shouldUseProxy
            ? getProxiedImageUrl(datasetId!, trimmedUrl, cacheVersion)
            : getImageDisplayUrl(datasetId || '', trimmedUrl, imageAuthConfig);
          
          // Debug logging for URL generation
          if (isRetrying) {
            console.log('Retry URL generation:', {
              originalUrl: trimmedUrl,
              shouldUseProxy,
              displayUrl,
              hasFailed,
              isPermanentlyFailed,
              datasetId,
              authConfigured: hasAuthConfigured(imageAuthConfig)
            });
          }
          
          const errorMessage = imageErrors.get(trimmedUrl);
    

          return (
            <div
              key={index}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all bg-white ${
                selectedIndex === index
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {showEnlargedView ? (
                // Simple small thumbnail view when enlarged view is open
                <div
                  className="cursor-pointer"
                  onClick={() => handleImageClick(index)}
                >
                  {isPermanentlyFailed && !isRetrying ? (
                    <div className="w-full h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center relative group">
                      <div className="text-center">
                        <div className="text-gray-400 text-lg mb-1">🖼️</div>
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-gray-500">Image unavailable</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryImage(trimmedUrl);
                            }}
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                      {/* Subtle error indicator */}
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full opacity-75">
                        !
                      </div>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {errorMessage || 'Failed to load'}
                      </div>
                    </div>
                  ) : isRetrying ? (
                    <div className="w-full h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center relative group">
                      <div className="text-center">
                        <div className="text-gray-400 text-lg mb-1 animate-pulse">🖼️</div>
                        <div className="text-gray-500 text-xs mb-1">Retrying...</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRetryingUrls(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(trimmedUrl);
                              return newSet;
                            });
                            setPermanentlyFailedUrls(prev => new Set([...prev, trimmedUrl]));
                            setImageErrors(prev => new Map([...prev, [trimmedUrl, 'Retry cancelled']]));
                          }}
                          className="text-red-500 text-xs hover:text-red-700 underline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Image
                      key={`${trimmedUrl}-${shouldUseProxy ? 'proxy' : 'direct'}-${isRetrying ? 'retry' : 'normal'}`}
                      src={displayUrl}
                      alt={`Image ${index + 1}`}
                      width={100}
                      height={80}
                      className="w-full h-16 object-cover"
                      unoptimized={true}
                      onLoad={() => handleImageLoad(trimmedUrl)}
                      onError={() => handleImageError(trimmedUrl, shouldUseProxy)}
                    />
                  )}
                  {/* Simple number indicator */}
                  <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                    {index + 1}
                  </div>
                  {/* Selection indicator */}
                  {metadata.isSelected && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                      ✓
                    </div>
                  )}
                </div>
              ) : (
                // Full thumbnail view when enlarged view is closed
                <>
                  {/* Checkbox and Image */}
                  <div className="flex items-start gap-2 p-2">
                    <input
                      type="checkbox"
                      checked={metadata.isSelected}
                      onChange={(e) => handleSelectionChange(index, e.target.checked)}
                      data-testid={`image-thumbnail-checkbox-${index}`}
                      className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      {isPermanentlyFailed && !isRetrying ? (
                        <div className="w-full h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center relative group">
                          <div className="text-center">
                            <div className="text-gray-400 text-lg mb-1">🖼️</div>
                            <div className="flex items-center justify-center gap-2 text-xs">
                              <span className="text-gray-500">Image unavailable</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetryImage(trimmedUrl);
                                }}
                                className="text-blue-500 hover:text-blue-700 underline"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                          {/* Subtle error indicator */}
                          <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full opacity-75">
                            !
                          </div>
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {errorMessage || 'Failed to load'}
                          </div>
                        </div>
                      ) : isRetrying ? (
                        <div className="w-full h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center relative group">
                          <div className="text-center">
                            <div className="text-gray-400 text-lg mb-1 animate-pulse">🖼️</div>
                            <div className="text-gray-500 text-xs mb-1">Retrying...</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRetryingUrls(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(trimmedUrl);
                                  return newSet;
                                });
                                setPermanentlyFailedUrls(prev => new Set([...prev, trimmedUrl]));
                                setImageErrors(prev => new Map([...prev, [trimmedUrl, 'Retry cancelled']]));
                              }}
                              className="text-red-500 text-xs hover:text-red-700 underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Image
                          key={`${trimmedUrl}-${shouldUseProxy ? 'proxy' : 'direct'}-${isRetrying ? 'retry' : 'normal'}`}
                          src={displayUrl}
                          alt={`Image ${index + 1}`}
                          width={100}
                          height={80}
                          className="w-full h-16 object-cover rounded border"
                          unoptimized={true}
                          onLoad={() => handleImageLoad(trimmedUrl)}
                          onError={() => handleImageError(trimmedUrl, shouldUseProxy)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div className="px-2 pb-2">
                    <Input
                      value={metadata.caption || ''}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      placeholder="Caption..."
                      data-testid={`image-thumbnail-caption-${index}`}
                      className="text-xs h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Image number overlay */}
                  <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button for Thumbnail View */}
      {!showEnlargedView && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => handleSaveAnnotations(fieldName || 'images', imageMetadata)}
            data-testid="image-thumbnails-save-button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Annotations
          </Button>
        </div>
      )}

      {/* Enlarged View */}
      <ImageEnlargedView
        isOpen={showEnlargedView}
        selectedIndex={enlargedIndex}
        imageMetadata={imageMetadata}
        fieldName={fieldName || columnName || 'images'}
        onCaptionChange={handleCaptionChange}
        onSelectionChange={handleSelectionChange}
        onClose={handleCloseEnlargedView}
        onSelectImage={handleEnlargedImageSelect}
        onSave={handleSaveAnnotations}
        datasetId={datasetId}
        imageAuthConfig={imageAuthConfig}
        cacheVersion={cacheVersion}
        failedImageUrls={failedImageUrls}
        permanentlyFailedUrls={permanentlyFailedUrls}
        imageErrors={imageErrors}
        retryingUrls={retryingUrls}
        onImageError={handleImageError}
        onRetryImage={handleRetryImage}
        onCancelRetry={handleCancelRetry}
      />
    </div>
  );
}
