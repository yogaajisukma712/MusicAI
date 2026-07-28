'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import VideoList from '@/components/VideoList';
import AudioPlayer from '@/components/AudioPlayer';
import { SearchResult } from '@/lib/types';

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<(SearchResult & { audioUrl?: string }) | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (video: SearchResult) => {
    setCurrentVideo(video);
    setAudioLoading(true);
    setAudioError(null);
    try {
      console.log('Fetching audio for:', video.videoUrl);
      const res = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: video.videoUrl }),
      });
      if (!res.ok) throw new Error('Failed to get audio');
      const data = await res.json();
      console.log('Audio URL:', data.audioUrl);
      setCurrentVideo({ ...video, audioUrl: data.audioUrl });
    } catch (e) {
      console.error('Play error:', e);
      setAudioError(e instanceof Error ? e.message : 'Failed to fetch audio');
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">MusicAI</h1>
      <SearchBar onSearch={handleSearch} loading={loading} />
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      <VideoList results={results} onPlay={handlePlay} loading={loading} />
      {currentVideo && (
        <AudioPlayer
          video={currentVideo}
          loading={audioLoading}
          fetchError={audioError}
        />
      )}
    </main>
  );
}
