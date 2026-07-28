'use client';

import { useState, useEffect } from 'react';
import { SearchResult } from '@/lib/types';

interface AudioPlayerProps {
  video: SearchResult & { audioUrl?: string };
  loading?: boolean;
  fetchError?: string | null;
}

export default function AudioPlayer({ video, loading = false, fetchError = null }: AudioPlayerProps) {
  const [playbackError, setPlaybackError] = useState(false);
  const [audioErrorDetail, setAudioErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (video.audioUrl) {
      setPlaybackError(false);
      setAudioErrorDetail(null);
    }
  }, [video.audioUrl]);

  if (!video.audioUrl && !loading) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-sm truncate">{video.title}</p>
          <p className="text-gray-600 text-xs truncate">{video.uploader}</p>
        </div>
        <div className="flex-1">
          {loading && (
            <p className="text-blue-500 text-xs">Loading audio...</p>
          )}
          {fetchError && (
            <p className="text-red-500 text-xs">{fetchError}</p>
          )}
          {playbackError && (
            <p className="text-red-500 text-xs">{audioErrorDetail || 'Audio playback failed. Please try another video.'}</p>
          )}
          {video.audioUrl && (
            <audio
              controls
              autoPlay
              className="h-10 w-full"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget;
                const err = target.error;
                let detail = 'Audio playback failed. Please try another video.';
                if (err) {
                  if (err.code === err.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                    detail = 'Audio format not supported or source unavailable.';
                  } else if (err.code === err.MEDIA_ERR_ABORTED) {
                    detail = 'Audio playback was aborted.';
                  } else if (err.code === err.MEDIA_ERR_NETWORK) {
                    detail = 'Network error while loading audio.';
                  } else if (err.code === err.MEDIA_ERR_DECODE) {
                    detail = 'Audio decode error. The file may be corrupted.';
                  }
                }
                console.error('Audio playback error:', detail, 'URL:', video.audioUrl, 'Error:', err);
                setAudioErrorDetail(detail);
                setPlaybackError(true);
              }}
              onCanPlay={() => {
                setPlaybackError(false);
                setAudioErrorDetail(null);
              }}
              onStalled={() => {
                console.warn('Audio stalled:', video.audioUrl);
              }}
              onSuspend={() => {
                console.warn('Audio suspended:', video.audioUrl);
              }}
            >
              <source src={video.audioUrl} type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </div>
    </div>
  );
}
