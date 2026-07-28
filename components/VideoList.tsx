'use client';

import VideoCard from '@/components/VideoCard';

interface SearchResult {
  videoId: string;
  title: string;
  uploader: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  videoUrl: string;
}

interface VideoListProps {
  results: SearchResult[];
  onPlay: (video: SearchResult) => void;
  loading: boolean;
}

export default function VideoList({ results, onPlay, loading }: VideoListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Searching...</p>
      </div>
    );
  }

  if (!results.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {results.map((video) => (
        <VideoCard key={video.videoId} video={video} onPlay={onPlay} />
      ))}
    </div>
  );
}
