
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle, Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  contentType?: string;
  onProgress: (progress: number) => void;
  initialProgress?: number;
  moduleId: string;
  onCompleted: (moduleId: string) => void;
  onAdvanceToNext?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  contentType = 'url',
  onProgress, 
  initialProgress = 0,
  moduleId,
  onCompleted,
  onAdvanceToNext
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(Math.min(Math.max(initialProgress, 0), 100));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  
  // Memoize the embed URL to prevent unnecessary recalculations
  const embedUrl = useMemo(() => {
    if (contentType !== 'url') return '';
    
    let url = videoUrl;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      if (!url.includes('embed')) {
        const videoId = url.includes('v=') 
          ? new URLSearchParams(url.split('?')[1]).get('v')
          : url.split('/').pop();
        url = `https://www.youtube.com/embed/${videoId}`;
      }
      
      url = url.includes('?') 
        ? `${url}&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}` 
        : `${url}?rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;
    }
    
    if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const videoId = url.split('/').pop();
      url = `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  }, [videoUrl, contentType]);
  
  // Security: Prevent right-clicking and keyboard shortcuts for download
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        title: "Download Restricted",
        description: "Video downloading is not permitted for this content.",
        variant: "destructive",
      });
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common download shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        toast({
          title: "Download Restricted",
          description: "Video downloading is not permitted for this content.",
          variant: "destructive",
        });
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast]);

  // Optimized video event handlers with useCallback
  const handleLoadedMetadata = useCallback(() => {
    setLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;

    const progressPercent = Math.min((video.currentTime / video.duration) * 100, 100);
    setProgress(progressPercent);
    setCurrentTime(video.currentTime);
    onProgress(progressPercent);

    // Mark as completed when 90% watched
    if (progressPercent >= 90 && progress < 90) {
      onCompleted(moduleId);
      
      if (onAdvanceToNext) {
        setTimeout(() => {
          onAdvanceToNext();
        }, 1500);
      }
    }
  }, [onProgress, onCompleted, moduleId, onAdvanceToNext, progress]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  
  const handleError = useCallback(() => {
    setLoading(false);
    setError('Failed to load video. Please try again later.');
  }, []);

  // Handle direct video file playback with optimized event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || contentType !== 'file') return;

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [contentType, handleLoadedMetadata, handleTimeUpdate, handlePlay, handlePause, handleError]);

  // Optimized iframe progress tracking
  useEffect(() => {
    if (contentType !== 'url') return;

    let progressInterval: NodeJS.Timeout;
    
    if (!loading && !error) {
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = Math.min(prevProgress + 5, 100);
          
          if (newProgress !== prevProgress) {
            onProgress(newProgress);
          }
          
          if (newProgress === 100 && prevProgress !== 100) {
            onCompleted(moduleId);
            
            if (onAdvanceToNext) {
              setTimeout(() => {
                onAdvanceToNext();
              }, 1500);
            }
          }
          
          return newProgress;
        });
      }, 3000);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading, error, contentType, onProgress, onCompleted, moduleId, onAdvanceToNext]);
  
  const handleIframeLoad = useCallback(() => {
    setLoading(false);
  }, []);
  
  const handleIframeError = useCallback(() => {
    setLoading(false);
    setError('Failed to load video. Please try again later.');
  }, []);

  // Optimized control handlers
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.warn('Failed to play video:', err);
        setError('Failed to play video. Please try again.');
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen().then(() => setIsFullscreen(true));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  }, [isFullscreen]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleMarkAsCompleted = useCallback(() => {
    setProgress(100);
    onProgress(100);
    onCompleted(moduleId);
    
    toast({
      title: "Module Completed",
      description: "This module has been marked as completed.",
    });
    
    if (onAdvanceToNext) {
      setTimeout(() => {
        onAdvanceToNext();
      }, 1500);
    }
  }, [onProgress, onCompleted, moduleId, onAdvanceToNext, toast]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading video...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="destructive" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
      
      <div className="aspect-video w-full overflow-hidden rounded-md relative">
        {contentType === 'file' ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              onContextMenu={(e) => e.preventDefault()}
              controlsList="nodownload"
              preload="metadata"
              playsInline
            />
            
            {/* Custom video controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center space-x-4 text-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div 
                  className="flex-1 h-2 bg-white/30 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-brand-purple rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                
                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            loading="lazy"
            title="Video content"
          ></iframe>
        )}
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(Math.min(progress, 100))}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-purple rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleMarkAsCompleted}
            className="bg-brand-purple hover:bg-brand-purple/90 font-medium"
            disabled={progress >= 100}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {progress >= 100 ? "Completed" : "Mark as Completed"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
