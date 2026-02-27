'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import OmniSearch from '@/components/OmniSearch';
import MediaGrid from '@/components/MediaGrid';
import type { UnifiedMedia, CategoryFilter, SearchFilters } from '@/types';

const SmartPlayer = dynamic(() => import('@/components/SmartPlayer'), { ssr: false });
const ChatInput = dynamic(() => import('@/components/ChatInput'), { ssr: false });

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border-2 border-zinc-900 overflow-hidden">
          <div className="aspect-video bg-zinc-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-zinc-200 animate-pulse w-3/4 rounded" />
            <div className="h-3 bg-zinc-200 animate-pulse w-full rounded" />
            <div className="h-3 bg-zinc-200 animate-pulse w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SearchResponse {
  media: UnifiedMedia[];
  total: number;
  hasMore: boolean;
  nextPageToken: string | null;
  error?: string;
}

const CATEGORY_TITLES: Record<CategoryFilter, string> = {
  all: 'Contenido Destacado',
  documental: 'Documentales',
  ciencia: 'Ciencia',
  pelicula: 'Películas',
  opera: 'Ópera',
  podcast: 'Podcasts',
  tutorial: 'Tutoriales',
  concierto: 'Conciertos',
  arte: 'Arte',
  cortometraje: 'Cortogramas',
  entretenimiento: 'TV',
};

export default function Home() {
  const [selectedMedia, setSelectedMedia] = useState<UnifiedMedia | null>(null);
  const [searchResults, setSearchResults] = useState<UnifiedMedia[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isMobileView, setIsMobileView] = useState(false);
  
  const loadingRef = useRef(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  const performSearch = async (query: string, category: CategoryFilter, filters: SearchFilters, pageToken?: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    if (pageToken) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setSearchResults([]);
    }
    setSearchError(null);
    
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      params.set('category', category);
      if (filters.duration !== 'any') params.set('duration', filters.duration);
      if (filters.uploadDate !== 'any') params.set('uploadDate', filters.uploadDate);
      if (pageToken) params.set('pageToken', pageToken);
      
      console.log('Buscando:', params.toString());
      
      const response = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await response.json();
      
      console.log('Respuesta:', { videos: data.media?.length, hasMore: data.hasMore, nextPage: data.nextPageToken });
      
      if (data.media?.length > 0) {
        setSearchResults(prev => {
          if (pageToken) {
            const existingIds = new Set(prev.map(m => m.id));
            const newItems = data.media.filter(m => !existingIds.has(m.id));
            return [...prev, ...newItems];
          }
          return data.media;
        });
        setHasMore(data.hasMore ?? false);
        setNextPageToken(data.nextPageToken ?? null);
      } else if (!pageToken) {
        setSearchResults([]);
        setHasMore(false);
        setNextPageToken(null);
      }
      
      if (data.error) setSearchError(data.error);
    } catch {
      setSearchError('Error al cargar');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      performSearch('', 'all', { duration: 'any', uploadDate: 'any' });
    }
  }, []);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && nextPageToken && !loadingRef.current) {
          console.log('Scroll detectado, cargando mas...', currentQuery);
          performSearch(currentQuery, selectedCategory, { duration: 'any', uploadDate: 'any' }, nextPageToken);
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, nextPageToken, selectedCategory, currentQuery]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearch = useCallback((query: string, category: CategoryFilter, filters: SearchFilters) => {
    console.log('handleSearch llamado:', { query, category, filters });
    setCurrentQuery(query);
    setSelectedCategory(category);
    setHasMore(false);
    setNextPageToken(null);
    performSearch(query, category, filters);
  }, []);

  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setSelectedCategory(category);
    setSearchError(null);
    setHasMore(false);
    setNextPageToken(null);
    setSearchResults([]);
    performSearch(currentQuery, category, { duration: 'any', uploadDate: 'any' });
  }, [currentQuery]);

  const loadMore = useCallback(() => {
    if (nextPageToken && !loadingRef.current) {
      performSearch(currentQuery, selectedCategory, { duration: 'any', uploadDate: 'any' }, nextPageToken);
    }
  }, [nextPageToken, currentQuery, selectedCategory]);

  const handleSelectMedia = useCallback((media: UnifiedMedia) => {
    const idx = searchResults.findIndex(m => m.id === media.id);
    setCurrentIndex(idx);
    setSelectedMedia(media);
  }, [searchResults]);

  const handleNextMedia = useCallback(() => {
    if (currentIndex < searchResults.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedMedia(searchResults[newIndex]);
    }
  }, [currentIndex, searchResults]);

  const handlePrevMedia = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedMedia(searchResults[newIndex]);
    }
  }, [currentIndex, searchResults]);

  const handleClosePlayer = useCallback(() => {
    setSelectedMedia(null);
    setCurrentIndex(-1);
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <header className="pt-20 pb-12 px-6 bg-white border-b-2 border-zinc-900 flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.h1 
            className="font-black uppercase tracking-tighter leading-none mb-6 flex items-baseline justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-[#D946EF] text-5xl md:text-7xl drop-shadow-[0_5px_15px_rgba(34,211,238,0.6)]">T</span>
            <span className="text-[#22D3EE] text-2xl md:text-4xl drop-shadow-[0_5px_15px_rgba(217,70,239,0.5)]">utor</span>
            <span className="text-[#D946EF] text-5xl md:text-7xl ml-1 drop-shadow-[0_5px_15px_rgba(34,211,238,0.6)]">V</span>
            <span className="text-[#22D3EE] text-2xl md:text-4xl drop-shadow-[0_5px_15px_rgba(217,70,239,0.5)]">ideo</span>
            <span className="text-[#D946EF] text-5xl md:text-7xl ml-1 drop-shadow-[0_5px_15px_rgba(34,211,238,0.6)]">IA</span>
          </motion.h1>
          <p className="text-zinc-600 text-xl md:text-2xl font-medium max-w-2xl">
            Tu plataforma educativa inteligente. Explora documentales, ciencia, opera y mas.
          </p>
          <div className="w-full">
            <OmniSearch
              onSearch={handleSearch}
              onCategoryChange={handleCategoryChange}
              selectedCategory={selectedCategory}
              isLoading={isLoading}
            />
          </div>
        </div>
      </header>

      <main className="px-6 pb-[150px] lg:pb-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 mt-8">
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight border-l-4 border-[#D946EF] pl-4">
              {CATEGORY_TITLES[selectedCategory]}
            </h2>
            {searchResults.length > 0 && (
              <div className="flex items-center gap-3">
                {hasMore && !isLoadingMore && (
                  <motion.button
                    onClick={loadMore}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 bg-cyan-400 border-2 border-zinc-900 flex items-center justify-center text-zinc-900 font-black text-lg hover:shadow-[2px_2px_0px_#D946EF] transition-all cursor-pointer"
                    title="Cargar mas videos"
                  >
                    +
                  </motion.button>
                )}
                <span className="text-sm font-bold text-zinc-500 bg-zinc-100 px-3 py-1 border-2 border-zinc-300 select-none">
                  {searchResults.length} videos
                </span>
              </div>
            )}
          </div>

          {searchError && (
            <div className="mb-6 p-4 bg-amber-100 border-2 border-amber-500 text-amber-800 font-medium">
              {searchError}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SkeletonGrid />
              </motion.div>
            ) : searchResults.length > 0 ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MediaGrid media={searchResults} onSelectMedia={handleSelectMedia} />
                
                <div ref={observerRef} className="w-full flex flex-col items-center justify-center mt-12 pb-8 relative z-10">
                  {isLoadingMore ? (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-6 h-6 border-4 border-zinc-200 border-t-[#D946EF] rounded-full animate-spin" />
                      <span className="text-zinc-900 font-bold uppercase text-sm">Cargando mas videos...</span>
                    </div>
                  ) : hasMore ? (
                    <motion.button
                      onClick={loadMore}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-10 py-4 bg-cyan-400 border-2 border-zinc-900 text-zinc-900 font-bold text-sm hover:shadow-[6px_6px_0px_#D946EF] transition-all cursor-pointer"
                    >
                      CARGAR MAS VIDEOS
                    </motion.button>
                  ) : (
                    <p className="text-zinc-400 text-sm font-medium py-4">No hay mas videos para mostrar</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="bg-white border-2 border-zinc-900 p-8 max-w-md mx-auto shadow-[4px_4px_0px_#D946EF]">
                  <p className="text-zinc-600 font-medium">
                    No se encontraron resultados. Intenta con otra busqueda.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t-2 border-zinc-900 pt-8 pb-[140px] md:pb-8 px-6 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-zinc-400 text-sm font-medium">TutorVideoIA 2026 BY OCTAVIO TRS</p>
        </div>
      </footer>

      <AnimatePresence>
        {selectedMedia && (
          <SmartPlayer 
            media={selectedMedia} 
            onClose={handleClosePlayer}
            onNext={currentIndex < searchResults.length - 1 ? handleNextMedia : undefined}
            onPrev={currentIndex > 0 ? handlePrevMedia : undefined}
            currentIndex={currentIndex}
            totalItems={searchResults.length}
            allMedia={searchResults}
            onSelectMedia={handleSelectMedia}
            category={selectedCategory}
            onInternalSearch={(query) => { 
              handleSearch(query, 'all', { duration: 'any', uploadDate: 'any' }); 
              handleClosePlayer(); 
            }}
          />
        )}
      </AnimatePresence>

      {!selectedMedia && isMobileView && (
        <div className="md:hidden">
          <ChatInput 
            onSendMessage={(msg) => handleSearch(msg, selectedCategory, { duration: 'any', uploadDate: 'any' })}
            onSummarize={() => console.log('Resumen solicitado')}
            placeholder="Escribe un mensaje o busca..."
          />
        </div>
      )}
    </div>
  );
}
