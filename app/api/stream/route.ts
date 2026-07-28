import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const audioUrl = searchParams.get('url');
  console.log('Proxying audio URL:', audioUrl);

  if (!audioUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(audioUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const allowedHosts = [
    'googlevideo.com',
    'videoplayback.net',
    'invidious',
    'youtube.com',
    'yt3.ggpht.com',
  ];
  if (!allowedHosts.some((h) => parsedUrl.hostname.endsWith(h))) {
    return NextResponse.json({ error: 'Disallowed audio source' }, { status: 403 });
  }

  try {
    console.log('Proxying audio URL:', audioUrl);

    const axiosHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://www.youtube.com/',
    };

    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: axiosHeaders,
      timeout: 30000,
      maxRedirects: 5,
    });

    const contentType = response.headers['content-type'] || 'audio/mpeg';
    const contentLength = response.headers['content-length'];

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', String(contentType));
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');
    if (contentLength) responseHeaders.set('Content-Length', String(contentLength));

    return new NextResponse(response.data, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      return NextResponse.json(
        { error: 'Failed to fetch audio from source' },
        { status },
      );
    }
    return NextResponse.json(
      { error: 'Failed to stream audio' },
      { status: 500 },
    );
  }
}
