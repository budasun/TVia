export type MediaSource = 'youtube' | 'vimeo' | 'ted' | 'archive' | 'mega';

export type MediaCategory = 
  | 'documental' 
  | 'ciencia' 
  | 'opera' 
  | 'pelicula' 
  | 'podcast' 
  | 'tutorial' 
  | 'concierto'
  | 'arte'
  | 'cortometraje'
  | 'entretenimiento';

export type CategoryFilter = MediaCategory | 'all';
export type DurationFilter = 'any' | '20-35' | '36-60' | '>60';
export type UploadDateFilter = 'any' | 'hour' | 'today' | 'week' | 'month' | 'year';

export interface SearchFilters {
  duration: DurationFilter;
  uploadDate: UploadDateFilter;
}

export interface UnifiedMedia {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
  source: MediaSource;
  category: MediaCategory;
  duration?: string;
  durationSeconds?: number;
  author?: string;
  tags?: string[];
  createdAt?: Date;
  publishedAt?: string;
  viewCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  videoContext?: UnifiedMedia;
}

export interface TutorResponse {
  id: string;
  content: string;
  suggestions?: string[];
  relatedTopics?: string[];
}
