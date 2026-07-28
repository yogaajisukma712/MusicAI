import axios from 'axios';

export interface SearchResult {
  videoId: string;
  title: string;
  uploader: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  videoUrl: string;
}

const DEFAULT_INSTANCES = [
  'https://inv.zoomerville.com',
  'https://yewtu.be',
  'https://invidious.tiekoetter.com',
];

const API_REGISTRY = 'https://api.invidious.io/instances.json';

function normalizeInstance(raw: string): string {
  return raw.replace(/\/+$/, '');
}

async function fetchInstanceList(): Promise<string[]> {
  try {
    const response = await axios.get(API_REGISTRY, {
      timeout: 8000,
    });
    const data = Array.isArray(response.data) ? response.data : [];
    const apiEnabled = data
      .filter((entry: any) => {
        if (!Array.isArray(entry) || entry.length < 2) return false;
        const meta = entry[1];
        if (!meta || meta.type !== 'https') return false;
        if (meta.api !== true && meta.monitor?.last_status !== 200) return false;
        const uri = typeof meta.uri === 'string' ? meta.uri : null;
        return !!uri;
      })
      .map((entry: any) => normalizeInstance(entry[1].uri));
    return apiEnabled.length > 0 ? apiEnabled : DEFAULT_INSTANCES;
  } catch {
    return DEFAULT_INSTANCES;
  }
}

const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i === retries) break;
      const delay = baseDelay * 2 ** i + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError!;
}

function isJsonResponse(response: any): boolean {
  const type = response?.headers?.['content-type'] || '';
  return type.includes('application/json');
}

function classifyError(instance: string, error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return `timeout on ${instance}`;
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      if (typeof data === 'string' && data.includes('Attention Required')) return `Cloudflare block on ${instance}`;
      if (typeof data === 'string' && data.includes('shutdown')) return `instance shutdown ${instance}`;
      return `HTTP ${status} from ${instance}`;
    }
    return `network error on ${instance}: ${error.message}`;
  }
  return `unexpected error on ${instance}: ${error?.message || error}`;
}

const AUDIO_ITAGS = new Set([139, 140, 141, 249, 250, 251]);

function resolveUrl(base: string, url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${base}${url}`;
  return url;
}

export class YoutubeAudioRepository {
  private static instanceList: string[] = DEFAULT_INSTANCES;
  private static instanceListPromise: Promise<string[]> | null = null;

  private static async getInstanceList(): Promise<string[]> {
    if (!this.instanceListPromise) {
      this.instanceListPromise = fetchInstanceList().then((list) => {
        this.instanceList = list.length > 0 ? list : DEFAULT_INSTANCES;
        return this.instanceList;
      }).catch(() => {
        this.instanceListPromise = null;
        return this.instanceList;
      });
    }
    return this.instanceListPromise;
  }

  async search(keywords: string, limit: number = 10): Promise<SearchResult[]> {
    const encodedQuery = encodeURIComponent(keywords);
    const instances = await YoutubeAudioRepository.getInstanceList();
    const errors: string[] = [];
    const retries = 2;
    const baseDelay = 800;

    for (const instance of instances) {
      const normalized = normalizeInstance(instance);
      try {
        const searchUrl = `${normalized}/api/v1/search?q=${encodedQuery}&type=video&sort_by=relevance`;
        const response = await withRetry(
          () =>
            axiosInstance.get(searchUrl, {}),
          retries,
          baseDelay,
        );

        if (!isJsonResponse(response)) {
          const blocked = typeof response.data === 'string' && response.data.length > 0;
          errors.push(blocked ? `Got HTML/antibot page from ${normalized}` : `Invalid response from ${normalized}`);
          continue;
        }

        const results = parseSearchResults(response.data, limit);
        if (results.length > 0) {
          return results;
        }
        errors.push(`No results from ${normalized}`);
      } catch (error) {
        const message = classifyError(normalized, error);
        console.warn(`Instance ${normalized} failed: ${message}`);
        errors.push(message);
      }
    }

    const summary = errors.join('; ');
    throw new Error(`All Invidious instances failed: ${summary}`);
  }

  async getAudioUrl(videoUrl: string): Promise<string> {
    const videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
    if (!videoId) {
      throw new Error('Invalid video URL');
    }

    const instances = await YoutubeAudioRepository.getInstanceList();
    const normalizedInstances = instances.map(normalizeInstance);
    const errors: string[] = [];
    const retries = 2;
    const baseDelay = 800;

    for (const instance of normalizedInstances) {
      const infoUrl = `${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats,formatStreams,title,author,lengthSeconds,videoThumbnails`;

      try {
        const response = await withRetry(
          () =>
            axiosInstance.get(infoUrl, {}),
          retries,
          baseDelay,
        );

        if (!isJsonResponse(response)) {
          errors.push(`Invalid response from ${instance}`);
          continue;
        }

        const responseData = response.data;
        console.log(`Invidious response from ${instance}: adaptiveFormats=${Array.isArray(responseData.adaptiveFormats) ? responseData.adaptiveFormats.length : 0}, formatStreams=${Array.isArray(responseData.formatStreams) ? responseData.formatStreams.length : 0}`);

        const audioUrl = parseAudioUrl(responseData, instance);
        if (audioUrl) {
          console.log('Audio URL:', audioUrl);
          return audioUrl;
        }
        errors.push(`No audio stream on ${instance}`);
      } catch (error) {
        const message = classifyError(instance, error);
        console.warn(`Audio instance ${instance} failed: ${message}`);
        errors.push(message);
      }
    }

    const summary = errors.join('; ');
    throw new Error(`All audio instances failed: ${summary}`);
  }
}

function parseSearchResults(data: any, limit: number): SearchResult[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item: any): SearchResult | null => {
      const videoId: string = item.videoId;
      const title: string = item.title;
      const uploader: string = item.author;
      const durationSeconds: number = item.lengthSeconds ?? -1;

      if (!videoId || !title) return null;

      const thumbnailUrl: string = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

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

function parseAudioUrl(data: any, instanceOrigin: string): string | null {
  const allFormats: any[] = [];

  if (Array.isArray(data?.adaptiveFormats)) {
    allFormats.push(...data.adaptiveFormats);
  }

  if (Array.isArray(data?.formatStreams)) {
    allFormats.push(...data.formatStreams);
  }

  console.log(`parseAudioUrl: checking ${allFormats.length} total formats from ${instanceOrigin}`);

  const audioFormats = allFormats
    .filter((fmt: any) => {
      if (!fmt.url) return false;
      if (fmt.type?.startsWith('audio/')) return true;
      if (AUDIO_ITAGS.has(fmt.itag)) return true;
      return false;
    })
    .map((fmt: any) => ({
      url: resolveUrl(instanceOrigin, fmt.url),
      bitrate: fmt.bitrate ?? 0,
      itag: fmt.itag ?? 0,
      type: fmt.type ?? 'unknown',
    }));

  if (audioFormats.length === 0) {
    console.warn('parseAudioUrl: no audio formats found. Available itags:', allFormats.map((f: any) => `${f.itag}:${f.type}`).join(', '));
    return null;
  }

  audioFormats.sort((a, b) => b.bitrate - a.bitrate);
  const best = audioFormats[0];
  console.log(`parseAudioUrl: selected audio format itag=${best.itag} type=${best.type} bitrate=${best.bitrate}`);
  return best.url;
}
