'use client';

import { Play, Clock, Calendar, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useState } from 'react';
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
  recetas: 'bg-green-400 text-zinc-900',
  series: 'bg-red-400 text-white',
  noticias: 'bg-blue-400 text-white',
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
  cortometraje: 'Corto',
  recetas: 'Receta',
  series: 'Serie',
  noticias: 'Noticia',
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

function extractSeasonId(mediaId: string): string | null {
  const match = mediaId.toLowerCase().match(/^(breakingbad|simpsons|bettercallsaul|onepiece|blackmirror|bebereno|futurama|lotr|mandalorian)-t(\d+)$/);
  if (match) {
    const series = match[1];
    const seasonNum = parseInt(match[2], 10);
    return `${series}-t${seasonNum}`;
  }
  return null;
}

function extractSeasonFromEpisode(mediaId: string): string | null {
  const lowerId = mediaId.toLowerCase();
  let match = lowerId.match(/^(breakingbad|simpsons|futurama|lotr)-(\d+)x(\d+)$/);
  if (match) {
    const series = match[1];
    const seasonNum = parseInt(match[2], 10);
    return `${series}-t${seasonNum}`;
  }
  match = lowerId.match(/^(bettercallsaul|onepiece|blackmirror|bebereno)-t(\d+)x(\d+)$/);
  if (match) {
    const series = match[1];
    const seasonNum = parseInt(match[2], 10);
    return `${series}-t${seasonNum}`;
  }
  match = lowerId.match(/^(breakingbad|simpsons|futurama|lotr|mandalorian)-t(\d+)x(\d+)$/);
  if (match) {
    const series = match[1];
    const seasonNum = parseInt(match[2], 10);
    return `${series}-t${seasonNum}`;
  }
  return null;
}

interface MediaGridProps {
  media: UnifiedMedia[];
  onSelectMedia: (media: UnifiedMedia) => void;
}

function MediaCard({ item, onSelectMedia }: { item: UnifiedMedia; onSelectMedia: (media: UnifiedMedia) => void }) {
  const thumbnailSrc = item.thumbnail || BRAND_PLACEHOLDER;
  const isFolder = item.source === 'folder';
  
  return (
    <div
      onClick={() => onSelectMedia(item)}
      className={`block bg-white border-2 border-zinc-900 cursor-pointer hover:shadow-[6px_6px-0px_#00ffff] hover:-translate-y-1 transition-all duration-200 overflow-hidden ${isFolder ? 'ring-4 ring-cyan-400' : ''}`}
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-200">
        <img
          src={thumbnailSrc}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          className="transition-transform duration-300 hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => { 
            (e.target as HTMLImageElement).src = BRAND_PLACEHOLDER;
          }}
        />
        <div className="absolute inset-0 bg-zinc-900/0 hover:bg-zinc-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all group">
          <div className="w-14 h-14 bg-cyan-400 border-2 border-zinc-900 flex items-center justify-center">
            {isFolder ? (
              <Folder className="w-6 h-6 text-zinc-900" />
            ) : (
              <Play className="w-6 h-6 text-zinc-900 ml-1" />
            )}
          </div>
        </div>
        {isFolder ? (
          <div className="absolute top-2 left-2 px-2 py-1 bg-cyan-400 text-zinc-900 text-xs font-bold uppercase border border-zinc-900 flex items-center gap-1">
            <Folder className="w-3 h-3" />
            TEMPORADA
          </div>
        ) : (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold uppercase border border-zinc-900">
            {item.source.toUpperCase()}
          </div>
        )}
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
}

export default function MediaGrid({ media, onSelectMedia }: MediaGridProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleMediaClick = (item: UnifiedMedia) => {
    if (item.source === 'folder') {
      toggleFolder(item.id);
    } else {
      onSelectMedia(item);
    }
  };

  const folders = media.filter(m => m.source === 'folder');
  const episodes = media.filter(m => m.source !== 'folder');

  const getEpisodesForFolder = (folderId: string): UnifiedMedia[] => {
    const seasonId = extractSeasonId(folderId);
    if (!seasonId) return [];
    
    const matchingEpisodes = episodes.filter(ep => {
      const epSeason = extractSeasonFromEpisode(ep.id);
      return epSeason === seasonId;
    });
    
    return matchingEpisodes;
  };

const folderItems = folders.map(folder => ({
    folder,
    episodes: getEpisodesForFolder(folder.id)
  }));

  const episodeIdsInFolders = new Set(
    folderItems.flatMap(({ episodes }) => episodes.map(ep => ep.id))
  );

  const looseEpisodes = media.filter(
    (item) => item.source !== 'folder' && !episodeIdsInFolders.has(item.id)
  );

  return (
    <div className="space-y-6">
      {folderItems.map(({ folder, episodes: folderEpisodes }) => (
        <div key={folder.id} className="border-2 border-zinc-900 bg-white overflow-hidden">
          <div
            onClick={() => handleMediaClick(folder)}
            className="flex items-center gap-3 p-4 bg-cyan-400 cursor-pointer hover:bg-cyan-300 transition-colors"
          >
            {expandedFolders.has(folder.id) ? (
              <ChevronDown className="w-6 h-6 text-zinc-900" />
            ) : (
              <ChevronRight className="w-6 h-6 text-zinc-900" />
            )}
            <Folder className="w-8 h-8 text-zinc-900" />
            <div className="flex-1">
              <h3 className="text-zinc-900 font-bold text-lg">{folder.title}</h3>
              <p className="text-zinc-700 text-sm">{folder.description}</p>
            </div>
            <span className="text-zinc-900 font-bold text-sm">
              {folderEpisodes.length} episodios
            </span>
          </div>
          
          {expandedFolders.has(folder.id) && folderEpisodes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-zinc-50">
              {folderEpisodes.map((episode) => (
                <MediaCard 
                  key={episode.id} 
                  item={episode} 
                  onSelectMedia={onSelectMedia} 
                />
              ))}
            </div>
          )}
          
          {expandedFolders.has(folder.id) && folderEpisodes.length === 0 && (
            <div className="p-4 bg-zinc-50 text-zinc-500 text-center">
              No hay episodios disponibles para esta temporada
            </div>
          )}
        </div>
      ))}
      
      {looseEpisodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {looseEpisodes.map((item) => (
            <MediaCard key={item.id} item={item} onSelectMedia={onSelectMedia} />
          ))}
        </div>
      )}
    </div>
  );
}
