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

  useEffect(() => {
    if (video.audioUrl) {
      setPlaybackError(false);
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
            <p className="text-red-500 text-xs">Audio playback failed. Please try another video.</p>
          )}
          {video.audioUrl && (
            <audio
              controls
              autoPlay
              className="h-10 w-full"
              crossOrigin="anonymous"
              onError={() => {
                console.error('Audio playback error:', video.audioUrl);
                setPlaybackError(true);
              }}
              onCanPlay={() => {
                setPlaybackError(false);
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
