import { NextResponse } from 'next/server';
import type { UnifiedMedia, MediaCategory } from '@/types';
import YouTube from 'youtube-sr';

const relatedCache = new Map<string, { timestamp: number; data: UnifiedMedia[] }>();
const CACHE_DURATION = 1000 * 60 * 30;

function detectCategory(title: string, description: string): MediaCategory {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('documental') || text.includes('documentary') || text.includes('historia')) {
    return 'documental';
  }
  if (text.includes('ciencia') || text.includes('science') || text.includes('física') || text.includes('química')) {
    return 'ciencia';
  }
  if (text.includes('ópera') || text.includes('opera') || text.includes('sinfon') || text.includes('orchestra')) {
    return 'concierto';
  }
  if (text.includes('podcast') || text.includes('entrevista') || text.includes('interview')) {
    return 'podcast';
  }
  if (text.includes('tutorial') || text.includes('how to') || text.includes('cómo')) {
    return 'tutorial';
  }
  if (text.includes('art') || text.includes('arte') || text.includes('museo')) {
    return 'arte';
  }
  if (text.includes('simpson') || text.includes('entretenimiento') || text.includes('serie')) {
    return 'entretenimiento';
  }
  
  return 'documental';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, videoId } = body;
    
    const searchQuery = title?.split(' ').slice(0, 4).join(' ') || 'educational';
    const cacheKey = `related-${searchQuery.toLowerCase()}`;

    if (relatedCache.has(cacheKey)) {
      const cached = relatedCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('⚡ Videos relacionados desde caché:', cacheKey);
        const filtered = cached.data.filter(v => v.id !== videoId).slice(0, 6);
        return NextResponse.json({ media: filtered });
      }
    }

    console.log('🕵️ Buscando videos relacionados:', searchQuery);
    
    const results = await YouTube.search(searchQuery, { 
      limit: 10, 
      type: 'video' 
    });
    
    const media: UnifiedMedia[] = results
      .filter((v) => v.id !== videoId && v.id)
      .map((v) => ({
        id: v.id || '',
        title: v.title || '',
        url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : '',
        thumbnail: v.thumbnail?.url || (v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : ''),
        description: v.description || '',
        source: 'youtube' as const,
        category: detectCategory(v.title || '', v.description || ''),
        author: v.channel?.name || 'YouTube',
        tags: [],
        createdAt: new Date(),
        publishedAt: new Date().toISOString(),
        duration: v.durationFormatted || '',
        durationSeconds: 0,
      }));

    relatedCache.set(cacheKey, { timestamp: Date.now(), data: media });
    
    return NextResponse.json({ media: media.slice(0, 6) });
    
  } catch (error) {
    console.error('Related API Error:', error);
    return NextResponse.json({ media: [] });
  }
}
