import { NextResponse } from 'next/server';
import { YoutubeAudioRepository } from '@/lib/youtube';

const repo = new YoutubeAudioRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const results = await repo.search(query, 20);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    console.error('Search error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
