'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { Play, Clock, Calendar } from 'lucide-react';
import type { UnifiedMedia } from '@/types';

const BRAND_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%2318181b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial Black, Arial, sans-serif' font-weight='900' font-size='36' fill='%2322d3ee' letter-spacing='2'%3ETutorVideoIA%3C/text%3E%3C/svg%3E";

interface MediaGridProps {
  media: UnifiedMedia[];
  onSelectMedia: (media: UnifiedMedia) => void;
}

const categoryBadgeColors: Record<string, string> = {
  documental: 'bg-indigo-400 text-zinc-900',
  ciencia: 'bg-cyan-400 text-zinc-900',
  opera: 'bg-purple-400 text-zinc-900',
  pelicula: 'bg-rose-400 text-zinc-900',
  podcast: 'bg-amber-400 text-zinc-900',
  tutorial: 'bg-emerald-400 text-zinc-900',
  concierto: 'bg-pink-400 text-zinc-900',
  arte: 'bg-violet-400 text-zinc-900',
  entretenimiento: 'bg-yellow-400 text-zinc-900',
  cortometraje: 'bg-orange-400 text-zinc-900',
};

const categoryLabels: Record<string, string> = {
  documental: 'Documental',
  ciencia: 'Ciencia',
  opera: 'Ópera',
  pelicula: 'Película',
  podcast: 'Podcast',
  tutorial: 'Tutorial',
  concierto: 'Concierto',
  arte: 'Arte',
  entretenimiento: 'TV',
  cortometraje: 'Cortometraje',
};

function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
}

const MediaCard = memo(function MediaCard({ item, onSelectMedia }: { item: UnifiedMedia; onSelectMedia: (media: UnifiedMedia) => void }) {
  const [imgSrc, setImgSrc] = useState(item.thumbnail || BRAND_PLACEHOLDER);

  return (
    <div
      onClick={() => onSelectMedia(item)}
      className="block bg-white border-2 border-zinc-900 cursor-pointer hover:shadow-[6px_6px_0px_#00ffff] hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-200">
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          placeholder="empty"
          onError={() => { 
            setImgSrc(BRAND_PLACEHOLDER); 
          }}
        />
        <div className="absolute inset-0 bg-zinc-900/0 hover:bg-zinc-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all group">
          <div className="w-14 h-14 bg-cyan-400 border-2 border-zinc-900 flex items-center justify-center">
            <Play className="w-6 h-6 text-zinc-900 ml-1" />
          </div>
        </div>
        <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold uppercase border border-zinc-900">
          {item.source.toUpperCase()}
        </div>
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold uppercase ${categoryBadgeColors[item.category] || 'bg-zinc-400 text-zinc-900'} border border-zinc-900`}>
          {categoryLabels[item.category] || item.category}
        </div>
        {item.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-zinc-900 text-cyan-400 text-xs font-bold border border-cyan-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.duration}
          </div>
        )}
      </div>
      <div className="p-4 bg-white">
        <h3 className="text-zinc-900 font-bold text-sm line-clamp-2">
          {item.title}
        </h3>
        <p className="text-zinc-600 text-xs mt-2 line-clamp-2">
          {item.description}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-zinc-200">
          {item.author && (
            <span className="text-xs text-zinc-700 font-medium truncate max-w-[140px]">
              {item.author}
            </span>
          )}
          {item.publishedAt && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.publishedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function MediaGrid({ media, onSelectMedia }: MediaGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {media.map((item) => (
        <MediaCard key={item.id} item={item} onSelectMedia={onSelectMedia} />
      ))}
    </div>
  );
}
