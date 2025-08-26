import { useState, useEffect, useCallback, useRef } from 'react';
import { courseService } from '@/services/courseService';

interface VideoOptimizationOptions {
  preloadNext?: boolean;
  lazyLoad?: boolean;
  quality?: 'low' | 'medium' | 'high';
  bufferSize?: number;
}

interface VideoOptimizationState {
  isPreloaded: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export const useVideoOptimization = (
  videoId: string,
  options: VideoOptimizationOptions = {}
) => {
  const {
    preloadNext = true,
    lazyLoad = true,
    quality = 'medium',
    bufferSize = 5
  } = options;

  const [state, setState] = useState<VideoOptimizationState>({
    isPreloaded: false,
    isLoading: false,
    error: null,
    progress: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const videoCacheRef = useRef<Map<string, any>>(new Map());

  // Preload video data
  const preloadVideo = useCallback(async () => {
    if (videoCacheRef.current.has(videoId)) {
      setState(prev => ({ ...prev, isPreloaded: true }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const video = await courseService.fetchVideo(videoId);
      
      if (abortControllerRef.current.signal.aborted) return;

      if (video) {
        videoCacheRef.current.set(videoId, video);
        setState(prev => ({ 
          ...prev, 
          isPreloaded: true, 
          isLoading: false,
          progress: 100
        }));
      } else {
        throw new Error('Video not found');
      }
    } catch (error: any) {
      if (abortControllerRef.current?.signal.aborted) return;
      
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to preload video',
        isLoading: false
      }));
    }
  }, [videoId]);

  // Lazy load video when it comes into view
  const lazyLoadVideo = useCallback(() => {
    if (lazyLoad && !state.isPreloaded && !state.isLoading) {
      preloadVideo();
    }
  }, [lazyLoad, state.isPreloaded, state.isLoading, preloadVideo]);

  // Preload next videos in sequence
  const preloadNextVideos = useCallback(async (currentVideoIndex: number, allVideos: any[]) => {
    if (!preloadNext) return;

    const nextVideos = allVideos.slice(currentVideoIndex + 1, currentVideoIndex + 1 + bufferSize);
    
    for (const video of nextVideos) {
      if (videoCacheRef.current.has(video.id)) continue;
      
      try {
        const videoData = await courseService.fetchVideo(video.id);
        if (videoData) {
          videoCacheRef.current.set(video.id, videoData);
        }
      } catch (error) {
        console.warn(`Failed to preload video ${video.id}:`, error);
        // Continue with next video
      }
    }
  }, [preloadNext, bufferSize]);

  // Get video quality based on network conditions
  const getOptimalQuality = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          return 'low';
        } else if (connection.effectiveType === '3g') {
          return 'medium';
        } else {
          return 'high';
        }
      }
    }
    return quality;
  }, [quality]);

  // Optimize video URL based on quality
  const getOptimizedVideoUrl = useCallback((video: any) => {
    if (!video) return '';
    
    const optimalQuality = getOptimalQuality();
    
    // For YouTube videos, adjust quality parameters
    if (video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be')) {
      const qualityParam = optimalQuality === 'low' ? 'vq=small' : 
                          optimalQuality === 'medium' ? 'vq=medium' : 'vq=hd720';
      
      const separator = video.video_url.includes('?') ? '&' : '?';
      return `${video.video_url}${separator}${qualityParam}&rel=0&modestbranding=1`;
    }
    
    // For Vimeo videos
    if (video.video_url.includes('vimeo.com')) {
      const qualityParam = optimalQuality === 'low' ? 'quality=360p' : 
                          optimalQuality === 'medium' ? 'quality=720p' : 'quality=1080p';
      
      const separator = video.video_url.includes('?') ? '&' : '?';
      return `${video.video_url}${separator}${qualityParam}`;
    }
    
    return video.video_url;
  }, [getOptimalQuality]);

  // Get cached video data
  const getCachedVideo = useCallback(() => {
    return videoCacheRef.current.get(videoId);
  }, [videoId]);

  // Clear video cache
  const clearCache = useCallback(() => {
    videoCacheRef.current.clear();
    setState({
      isPreloaded: false,
      isLoading: false,
      error: null,
      progress: 0
    });
  }, []);

  // Abort current loading operation
  const abortLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Initialize video optimization
  useEffect(() => {
    if (!lazyLoad) {
      preloadVideo();
    }

    return () => {
      abortLoading();
    };
  }, [videoId, lazyLoad, preloadVideo, abortLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortLoading();
    };
  }, [abortLoading]);

  return {
    ...state,
    preloadVideo,
    lazyLoadVideo,
    preloadNextVideos,
    getOptimizedVideoUrl,
    getCachedVideo,
    clearCache,
    abortLoading
  };
};

// Hook for optimizing multiple videos
export const useBulkVideoOptimization = (
  videoIds: string[],
  options: VideoOptimizationOptions = {}
) => {
  const [optimizedVideos, setOptimizedVideos] = useState<Map<string, any>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const preloadBulkVideos = useCallback(async () => {
    const newLoadingStates = new Map(loadingStates);
    const newErrors = new Map(errors);
    
    // Set all videos to loading
    videoIds.forEach(id => newLoadingStates.set(id, true));
    setLoadingStates(newLoadingStates);

    try {
      // Preload videos in parallel with concurrency limit
      const concurrencyLimit = 3;
      const chunks = [];
      
      for (let i = 0; i < videoIds.length; i += concurrencyLimit) {
        chunks.push(videoIds.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(async (videoId) => {
          try {
            const video = await courseService.fetchVideo(videoId);
            if (video) {
              setOptimizedVideos(prev => new Map(prev).set(videoId, video));
            }
          } catch (error: any) {
            newErrors.set(videoId, error.message || 'Failed to load video');
          } finally {
            newLoadingStates.set(videoId, false);
          }
        });

        await Promise.all(promises);
        setLoadingStates(new Map(newLoadingStates));
        setErrors(new Map(newErrors));
      }
    } catch (error) {
      console.error('Bulk video optimization failed:', error);
    }
  }, [videoIds, loadingStates, errors]);

  const getVideo = useCallback((videoId: string) => {
    return optimizedVideos.get(videoId);
  }, [optimizedVideos]);

  const isLoading = useCallback((videoId: string) => {
    return loadingStates.get(videoId) || false;
  }, [loadingStates]);

  const getError = useCallback((videoId: string) => {
    return errors.get(videoId);
  }, [errors]);

  const clearAll = useCallback(() => {
    setOptimizedVideos(new Map());
    setLoadingStates(new Map());
    setErrors(new Map());
  }, []);

  return {
    optimizedVideos,
    loadingStates,
    errors,
    preloadBulkVideos,
    getVideo,
    isLoading,
    getError,
    clearAll
  };
};
