'use client';

import { SearchResult } from '@/lib/types';

interface AudioPlayerProps {
  video: SearchResult & { audioUrl?: string };
}

export default function AudioPlayer({ video }: AudioPlayerProps) {
  if (!video.audioUrl) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-sm truncate">{video.title}</p>
          <p className="text-gray-600 text-xs truncate">{video.uploader}</p>
        </div>
        <audio controls autoPlay className="h-10">
          <source src={video.audioUrl} type="audio/mp4" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}
