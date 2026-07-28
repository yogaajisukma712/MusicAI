import axios from 'axios';

export interface SearchResult {
  videoId: string;
  title: string;
  uploader: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  videoUrl: string;
}

const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.snopyta.org',
  'https://invidious.kavin.rocks',
  'https://invidious.projectsegfau.lt',
  'https://invidious.fdn.fr',
];

export class YoutubeAudioRepository {
  async search(keywords: string, limit: number = 10): Promise<SearchResult[]> {
    const encodedQuery = encodeURIComponent(keywords);
    let lastError: Error | null = null;

    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const searchUrl = `${instance}/api/v1/search?q=${encodedQuery}&type=video&sort_by=relevance`;
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13)',
            Accept: 'application/json',
          },
          timeout: 10000,
        });

        const results = parseSearchResults(response.data, limit);
        if (results.length > 0) {
          return results;
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error('Unknown error');
        console.warn(`Instance ${instance} failed: ${lastError.message}`);
      }
    }

    throw lastError || new Error('All Invidious instances failed');
  }

  async getAudioUrl(videoUrl: string): Promise<string> {
    const videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
    if (!videoId) {
      throw new Error('Invalid video URL');
    }

    const instance = INVIDIOUS_INSTANCES[0];
    const infoUrl = `${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats,title,author,lengthSeconds,videoThumbnails`;

    const response = await axios.get(infoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13)',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const audioUrl = parseAudioUrl(response.data);
    if (!audioUrl) {
      throw new Error('No audio stream found');
    }

    return audioUrl;
  }
}

function parseSearchResults(data: any, limit: number): SearchResult[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item: any) => {
      const videoId = item.videoId;
      const title = item.title;
      const uploader = item.author;
      const durationSeconds = item.lengthSeconds ?? -1;
      const thumbnailUrl = item.videoThumbnails?.[0]?.url ?? null;

      if (!videoId || !title) return null;

      return {
        videoId,
        title,
        uploader: uploader ?? 'Unknown',
        durationSeconds,
        thumbnailUrl,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter((item: SearchResult | null): item is SearchResult => item !== null)
    .slice(0, limit);
}

function parseAudioUrl(data: any): string | null {
  const adaptiveFormats = data?.adaptiveFormats;
  if (!Array.isArray(adaptiveFormats)) return null;

  const audioFormats = adaptiveFormats
    .filter((fmt: any) => fmt.type?.startsWith('audio/'))
    .map((fmt: any) => ({
      url: fmt.url,
      bitrate: fmt.bitrate ?? 0,
    }));

  if (audioFormats.length === 0) return null;

  audioFormats.sort((a, b) => b.bitrate - a.bitrate);
  return audioFormats[0].url;
}
