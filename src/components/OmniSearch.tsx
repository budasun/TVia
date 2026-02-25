'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Film, Microscope, Music, Podcast, Clock, Calendar, ChevronDown, Drama, Clapperboard, Palette, GraduationCap, Tv } from 'lucide-react';
import type { CategoryFilter, DurationFilter, UploadDateFilter, SearchFilters } from '@/types';

interface OmniSearchProps {
  onSearch: (query: string, category: CategoryFilter, filters: SearchFilters) => void;
  onCategoryChange: (category: CategoryFilter) => void;
  selectedCategory: CategoryFilter;
  isLoading?: boolean;
}

const categories = [
  { id: 'all' as CategoryFilter, label: 'Todo', icon: Sparkles },
  { id: 'documental' as CategoryFilter, label: 'Documentales', icon: Film },
  { id: 'ciencia' as CategoryFilter, label: 'Ciencia', icon: Microscope },
  { id: 'pelicula' as CategoryFilter, label: 'Películas', icon: Drama },
  { id: 'cortometraje' as CategoryFilter, label: 'Cortometrajes', icon: Clapperboard },
  { id: 'opera' as CategoryFilter, label: 'Ópera', icon: Music },
  { id: 'podcast' as CategoryFilter, label: 'Podcast', icon: Podcast },
  { id: 'tutorial' as CategoryFilter, label: 'Tutoriales', icon: GraduationCap },
  { id: 'concierto' as CategoryFilter, label: 'Conciertos', icon: Music },
  { id: 'arte' as CategoryFilter, label: 'Arte', icon: Palette },
  { id: 'entretenimiento' as CategoryFilter, label: 'TV', icon: Tv },
];

const durationOptions = [
  { id: 'any' as DurationFilter, label: 'Duración' },
  { id: '20-35' as DurationFilter, label: '20 a 35 min' },
  { id: '36-60' as DurationFilter, label: '36 min a 1 hr' },
  { id: '>60' as DurationFilter, label: 'Más de 1 hr' },
];

const uploadDateOptions = [
  { id: 'any' as UploadDateFilter, label: 'Fecha' },
  { id: 'hour' as UploadDateFilter, label: 'Última hora' },
  { id: 'today' as UploadDateFilter, label: 'Hoy' },
  { id: 'week' as UploadDateFilter, label: 'Esta semana' },
  { id: 'month' as UploadDateFilter, label: 'Este mes' },
  { id: 'year' as UploadDateFilter, label: 'Este año' },
];

export default function OmniSearch({ 
  onSearch, 
  onCategoryChange, 
  selectedCategory,
  isLoading = false
}: OmniSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    duration: 'any',
    uploadDate: 'any',
  });
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // FUNCIÓN PRINCIPAL: Previene la recarga de la página
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSearch(query, selectedCategory, filters);
  };

  const handleDurationChange = (duration: DurationFilter) => {
    setFilters(prev => ({ ...prev, duration }));
    setShowDurationDropdown(false);
  };

  const handleDateChange = (uploadDate: UploadDateFilter) => {
    setFilters(prev => ({ ...prev, uploadDate }));
    setShowDateDropdown(false);
  };

  const getDurationLabel = () => durationOptions.find(d => d.id === filters.duration)?.label || 'Duración';
  const getDateLabel = () => uploadDateOptions.find(d => d.id === filters.uploadDate)?.label || 'Fecha';

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* FORMULARIO DE BÚSQUEDA - Separado del resto */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 z-10">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca documentales, ciencia, ópera, tutoriales..."
            className="w-full bg-white border-2 border-zinc-900 pl-12 pr-28 py-3.5 text-base font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:shadow-[4px_4px_0px_#00ffff] transition-shadow"
          />
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-cyan-400 border-2 border-zinc-900 font-bold text-sm text-zinc-900 hover:bg-cyan-300 hover:shadow-[2px_2px_0px_#ff00ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'EXPLORAR'}
          </button>
        </div>
      </form>

      {/* FILTROS Y CATEGORÍAS - FUERA DEL FORM */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {/* Dropdown Duración */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowDurationDropdown(!showDurationDropdown);
              setShowDateDropdown(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 border-2 border-zinc-900 text-xs font-bold transition-all ${
              filters.duration !== 'any'
                ? 'bg-cyan-400 text-zinc-900 shadow-[2px_2px_0px_#00ffff]'
                : 'bg-white text-zinc-900 hover:shadow-[3px_3px_0px_#00ffff]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {getDurationLabel()}
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <AnimatePresence>
            {showDurationDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-44 bg-white border-2 border-zinc-900 overflow-hidden z-50"
              >
                {durationOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDurationChange(option.id);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                      filters.duration === option.id
                        ? 'bg-cyan-400 text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dropdown Fecha */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowDateDropdown(!showDateDropdown);
              setShowDurationDropdown(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 border-2 border-zinc-900 text-xs font-bold transition-all ${
              filters.uploadDate !== 'any'
                ? 'bg-fuchsia-400 text-zinc-900 shadow-[2px_2px_0px_#ff00ff]'
                : 'bg-white text-zinc-900 hover:shadow-[3px_3px_0px_#ff00ff]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {getDateLabel()}
            <ChevronDown className="w-3 h-3" />
          </button>
          
          <AnimatePresence>
            {showDateDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-2 w-44 bg-white border-2 border-zinc-900 overflow-hidden z-50"
              >
                {uploadDateOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDateChange(option.id);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                      filters.uploadDate === option.id
                        ? 'bg-fuchsia-400 text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separador */}
        <div className="h-6 w-0.5 bg-zinc-300 hidden sm:block" />

        {/* Botones de Categorías */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onCategoryChange(category.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-zinc-900 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-zinc-900 text-cyan-400 shadow-[4px_4px_0px_#00ffff]'
                    : 'bg-white text-zinc-900 hover:shadow-[3px_3px_0px_#00ffff] hover:-translate-y-0.5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
