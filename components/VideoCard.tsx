'use client';

import { SearchResult } from '@/lib/types';

interface VideoCardProps {
  video: SearchResult;
  onPlay: (video: SearchResult) => void;
}

export default function VideoCard({ video, onPlay }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="w-full h-40 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<div class=\"w-full h-40 bg-gray-200 flex items-center justify-center\"><span class=\"text-gray-400\">Thumbnail unavailable</span></div>';
            }}
          />
        ) : (
          <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No thumbnail</span>
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
        <p className="text-gray-600 text-xs mb-3">{video.uploader}</p>
        <button
          onClick={() => onPlay(video)}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Play
        </button>
      </div>
    </div>
  );
}
