import { NextResponse } from 'next/server';
import { YoutubeAudioRepository } from '@/lib/youtube';

const repo = new YoutubeAudioRepository();

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
    }

    const audioUrl = await repo.getAudioUrl(videoUrl);
    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Audio error:', error);
    return NextResponse.json({ error: 'Failed to get audio URL' }, { status: 500 });
  }
}
