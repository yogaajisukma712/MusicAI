import { NextResponse } from 'next/server';
import { YoutubeAudioRepository } from '@/lib/youtube';

const repo = new YoutubeAudioRepository();

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
    }

    console.log('Getting audio URL for:', videoUrl);
    const audioUrl = await repo.getAudioUrl(videoUrl);
    console.log('Audio URL extracted:', audioUrl);
    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Audio error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to get audio URL' }, { status: 500 });
  }
}
