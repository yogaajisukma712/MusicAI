import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const audioUrl = searchParams.get('url');

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
    console.log('Stream proxy request for URL:', audioUrl);
    console.log('Parsed hostname:', parsedUrl.hostname);

    const axiosHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://www.youtube.com/',
    };

    const response = await fetch(audioUrl, {
      headers: axiosHeaders,
      redirect: 'follow',
    });

    console.log('Upstream response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

    if (!response.ok || !response.body) {
      console.error('Upstream fetch failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch audio from source' },
        { status: response.status || 500 },
      );
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges') || 'bytes';

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    return new NextResponse(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to stream audio' },
      { status: 500 },
    );
  }
}
