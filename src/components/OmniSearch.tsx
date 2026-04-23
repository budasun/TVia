'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Film, Microscope, Music, Podcast, Clock, Calendar, ChevronDown, Drama, Clapperboard, Palette, GraduationCap, Tv, UtensilsCrossed, BookOpen, Newspaper, Sun, Moon } from 'lucide-react';
import type { CategoryFilter, DurationFilter, UploadDateFilter, SearchFilters } from '@/types';

interface OmniSearchProps {
  onSearch: (query: string, category: CategoryFilter, filters: SearchFilters) => void;
  onCategoryChange: (category: CategoryFilter) => void;
  selectedCategory: CategoryFilter;
  isLoading?: boolean;
}

const categories = [
  { id: 'all' as CategoryFilter, label: 'Todo', icon: Sparkles },
  { id: 'noticias' as CategoryFilter, label: 'Noticias', icon: Newspaper },
  { id: 'recetas' as CategoryFilter, label: 'Recetas', icon: UtensilsCrossed },
  { id: 'documental' as CategoryFilter, label: 'Docu', icon: Film },
  { id: 'ciencia' as CategoryFilter, label: 'Ciencia', icon: Microscope },
  { id: 'pelicula' as CategoryFilter, label: 'Peli', icon: Drama },
  { id: 'cortometraje' as CategoryFilter, label: 'Cortos', icon: Clapperboard },
  { id: 'opera' as CategoryFilter, label: 'Ópera', icon: Music },
  { id: 'podcast' as CategoryFilter, label: 'Podcast', icon: Podcast },
  { id: 'tutorial' as CategoryFilter, label: 'Tutoriales', icon: GraduationCap },
  { id: 'concierto' as CategoryFilter, label: 'Conciertos', icon: Music },
  { id: 'arte' as CategoryFilter, label: 'Arte', icon: Palette },
  { id: 'entretenimiento' as CategoryFilter, label: 'TV', icon: Tv },
  { id: 'series' as CategoryFilter, label: 'TV', icon: BookOpen },
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
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
      {/* FORMULARIO DE BÚSQUEDA */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto flex items-center gap-3">
        {/* Botón de tema - a la izquierda del input */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex-shrink-0 p-3 border-2 border-zinc-900 bg-yellow-400 dark:bg-yellow-500 hover:bg-yellow-300 dark:hover:bg-yellow-400 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(0,255,255,0.5)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none z-20"
          aria-label="Cambiar modo"
        >
          {isDarkMode ? (
            <Moon className="w-5 h-5 text-zinc-900" />
          ) : (
            <Sun className="w-5 h-5 text-zinc-900" />
          )}
        </button>

        <div className="relative flex-1 flex items-center">
          <div className="absolute left-4 z-10">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca documentales, ciencia, ópera, tutoriales..."
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-900 pl-12 pr-32 py-3.5 text-base font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:shadow-[4px_4px_0px_#00ffff] transition-shadow"
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

      {/* FILTROS Y CATEGORÍAS - Todo en una sola línea */}
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
                : 'bg-white dark:bg-zinc-800 dark:text-white text-zinc-900 hover:shadow-[3px_3px_0px_#00ffff]'
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
                className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-zinc-900 border-2 border-zinc-900 overflow-hidden z-50"
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
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
                : 'bg-white dark:bg-zinc-800 dark:text-white text-zinc-900 hover:shadow-[3px_3px_0px_#ff00ff]'
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
                className="absolute top-full left-0 mt-2 w-44 bg-white dark:bg-zinc-900 border-2 border-zinc-900 overflow-hidden z-50"
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
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separador - visible siempre */}
        <div className="h-6 w-0.5 bg-zinc-300 dark:bg-zinc-600" />

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
                    ? 'bg-zinc-900 dark:bg-zinc-700 text-cyan-400 shadow-[4px_4px_0px_#00ffff]'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white hover:shadow-[3px_3px_0px_#00ffff] hover:-translate-y-0.5'
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
