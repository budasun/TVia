'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import YouTube from 'react-youtube';
import { 
  X, 
  Send, 
  MessageCircle, 
  Sparkles, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Play,
  Download,
  MessageSquare,
  MessageSquareOff
} from 'lucide-react';
import type { UnifiedMedia, ChatMessage, TutorResponse } from '@/types';

interface SmartPlayerProps {
  media: UnifiedMedia | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex: number;
  totalItems: number;
  allMedia?: UnifiedMedia[];
  onSelectMedia?: (media: UnifiedMedia) => void;
  onInternalSearch?: (query: string) => void;
  category?: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function SuggestedVideoCard({ media, onClick }: { media: UnifiedMedia; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="shrink-0 text-left bg-white border border-zinc-900 overflow-hidden group hover:shadow-[3px_3px_0px_#00ffff] transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex gap-2 p-1.5">
        <div className="relative w-16 h-10 overflow-hidden shrink-0 border border-zinc-900">
          <Image 
            src={media.thumbnail} 
            alt={media.title}
            fill
            sizes="64px"
            className="object-cover"
            loading="lazy"
            placeholder="empty"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80'; }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[10px] text-zinc-900 font-medium line-clamp-1 group-hover:text-cyan-600 transition-colors">
            {media.title}
          </p>
          {media.duration && (
            <p className="text-[9px] text-zinc-500 mt-0.5">{media.duration}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function SmartPlayer({ 
  media, 
  onClose, 
  onNext, 
  onPrev,
  currentIndex,
  totalItems,
  allMedia = [],
  onSelectMedia,
  onInternalSearch,
  category
}: SmartPlayerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [suggestedVideos, setSuggestedVideos] = useState<UnifiedMedia[]>([]);
  const [hasSummary, setHasSummary] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState<{ playVideo: () => void; pauseVideo: () => void; setVolume: (v: number) => void; getVolume: () => number; mute: () => void; unMute: () => void; isMuted: () => boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 769);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (media) {
      setMessages([]);
      setHasSummary(false);
      setSuggestedVideos([]);
      const timer = setTimeout(() => {
        loadRelatedVideos(media);
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media?.id]);

  useEffect(() => {
    if (!youtubePlayer) return;

    // 1. Restaurar volumen al cargar un nuevo video
    try {
      const savedVolume = localStorage.getItem('videoschool_volume');
      const savedMuted = localStorage.getItem('videoschool_muted');
      
      if (savedVolume !== null) youtubePlayer.setVolume(parseInt(savedVolume, 10));
      if (savedMuted === 'true') youtubePlayer.mute();
      else if (savedMuted === 'false') youtubePlayer.unMute();
    } catch (e) { console.log('Esperando reproductor...'); }

    // 2. Guardar preferencias en segundo plano
    const interval = setInterval(() => {
      try {
        if (typeof youtubePlayer.getVolume === 'function') {
          localStorage.setItem('videoschool_volume', youtubePlayer.getVolume().toString());
          localStorage.setItem('videoschool_muted', youtubePlayer.isMuted().toString());
        }
      } catch (e) { /* Ignorar durante desmontaje */ }
    }, 2000);

    return () => clearInterval(interval);
  }, [youtubePlayer, media?.id]);

  useEffect(() => {
    if (media?.id) {
      fetch('/api/tagger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: media.id, 
          title: media.title, 
          description: media.description 
        })
      })
        .then(res => res.json())
        .then(data => console.log('Tags:', data))
        .catch(err => console.error('Tagger error:', err));
    }
  }, [media?.id, media?.title, media?.description]);

  const loadRelatedVideos = async (currentMedia: UnifiedMedia) => {
    try {
      const response = await fetch('/api/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentMedia.title,
          tags: currentMedia.tags,
          category: currentMedia.category,
          videoId: currentMedia.id,
        }),
      });
      
      const data = await response.json();
      
      if (data.media && data.media.length > 0) {
        const filtered = data.media.filter((m: UnifiedMedia) => m.id !== currentMedia.id);
        setSuggestedVideos(filtered.slice(0, 4));
      } else {
        const others = allMedia.filter(m => m.id !== currentMedia.id).slice(0, 4);
        setSuggestedVideos(others);
      }
    } catch (error) {
      console.error('Failed to load related videos:', error);
      const others = allMedia.filter(m => m.id !== currentMedia.id).slice(0, 4);
      setSuggestedVideos(others);
    }
  };

  const embedUrl = useMemo(() => {
    if (!media?.url) return null;
    
    const youtubeId = getYouTubeId(media.url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }
    
    const vimeoId = getVimeoId(media.url);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    }
    
    return null;
  }, [media?.url]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentVideo: media || undefined,
          youtubeId: getYouTubeId(media?.url || '') || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data: TutorResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: data.id,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSummary = async () => {
    if (isLoading || hasSummary) return;

    setIsLoading(true);
    setIsLoadingTranscript(true);

    const youtubeId = getYouTubeId(media?.url || '');

    const summaryPromptContent = 'Genera un resumen completo y estructurado del contenido del video. Incluye: tema central, cronología del argumento, conceptos clave, temas secundarios, evidencia y datos, citas textuales destacadas, conclusiones, preguntas para análisis y recomendaciones para profundizar.';

    const summaryPrompt: ChatMessage = {
      id: `user-summary-${Date.now()}`,
      role: 'user',
      content: summaryPromptContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, summaryPrompt]);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, summaryPrompt],
          currentVideo: media || undefined,
          youtubeId: youtubeId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data: TutorResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: data.id,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setHasSummary(true);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'No pude generar el resumen. Intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsLoadingTranscript(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generatePDF = async () => {
    if (messages.length === 0 || isExporting) return;
    
    setIsExporting(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const today = new Date();
      const dateStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      const headerHTML = `
        <div style="background: linear-gradient(135deg, #00CED1 0%, #00b3b3 100%); padding: 20px; margin-bottom: 20px; border-bottom: 3px solid #18181b;">
          <h1 style="font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; margin: 0; color: #18181b;">TutorVideoIA</h1>
          <p style="font-family: Arial, sans-serif; font-size: 12px; margin: 5px 0 0 0; color: #18181b;">Generado por Tutor IA</p>
          <p style="font-family: Arial, sans-serif; font-size: 11px; margin: 3px 0 0 0; color: #3f3f46;">Fecha: ${dateStr}</p>
        </div>
      `;
      
      const videoTitle = media?.title || 'Video de YouTube';
      const videoInfoHTML = `
        <div style="padding: 15px; background: #f4f4f5; margin-bottom: 20px; border-left: 4px solid #00CED1;">
          <p style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; margin: 0; color: #18181b;">Video Analizado:</p>
          <p style="font-family: Arial, sans-serif; font-size: 13px; margin: 5px 0 0 0; color: #52525b;">${videoTitle}</p>
        </div>
      `;
      
      const messagesHTML = messages.map((msg) => {
        const role = msg.role === 'user' ? 'ESTUDIANTE' : 'TUTOR TutorVideoIA';
        const bgColor = msg.role === 'user' ? '#cffafe' : '#f4f4f5';
        const borderColor = msg.role === 'user' ? '#00CED1' : '#d4d4d8';
        
        const contentFormatted = msg.content
          .replace(/^## (.+)$/gm, '<h2 style="font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #00CED1; margin: 15px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #e4e4e7;">$1</h2>')
          .replace(/^### (.+)$/gm, '<h3 style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #18181b; margin: 12px 0 8px 0;">$1</h3>')
          .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold; color: #18181b;">$1</strong>')
          .replace(/^\* (.+)$/gm, '<li style="font-family: Arial, sans-serif; font-size: 12px; color: #3f3f46; margin: 4px 0;">$1</li>')
          .replace(/^> (.+)$/gm, '<blockquote style="font-family: Arial, sans-serif; font-style: italic; font-size: 12px; color: #52525b; border-left: 3px solid #00CED1; padding-left: 10px; margin: 10px 0;">$1</blockquote>')
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/\n/g, '<br/>');
        
        return `
          <div style="margin-bottom: 15px; padding: 15px; background: ${bgColor}; border-left: 4px solid ${borderColor};">
            <p style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; margin: 0 0 8px 0; color: #71717a; text-transform: uppercase;">${role}</p>
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6; color: #18181b;">${contentFormatted}</div>
          </div>
        `;
      }).join('');
      
      const footerHTML = `
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e4e4e7; text-align: center;">
          <p style="font-family: Arial, sans-serif; font-size: 10px; color: #a1a1aa;">TutorVideoIA © 2026 - Plataforma Educativa Inteligente</p>
        </div>
      `;
      
      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 20mm 15mm; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #18181b; }
          </style>
        </head>
        <body>
          ${headerHTML}
          ${videoInfoHTML}
          ${messagesHTML}
          ${footerHTML}
        </body>
        </html>
      `;
      
      const element = document.createElement('div');
      element.innerHTML = fullHTML;
      
      const safeTitle = (media?.title || 'Resumen_Video').split(/\s+/).slice(0, 3).join('_').replace(/[^a-zA-Z0-9_]/g, '');
      
      const opt = {
        margin: 0,
        filename: `${safeTitle}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(element).save();
      
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleVideoPause = () => setIsPaused(true);
  const handleVideoPlay = () => setIsPaused(false);

  const handleVideoStateChange = (event: any) => {
    if (event.data === 0 && category === 'entretenimiento' && onNext) {
      setTimeout(() => onNext(), 1500);
    }
  };

  const handleVideoReady = (e: any) => {
    setYoutubePlayer(e.target);
  };

  const handleSelectSuggested = (suggestedMedia: UnifiedMedia) => {
    if (onSelectMedia) {
      onSelectMedia(suggestedMedia);
    }
  };

  if (!media) return null;

  const videoFlexValue = !isMobile && chatOpen ? '2 2 0' : '1 1 0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-zinc-900 flex"
    >
      {/* CONTENEDOR PRINCIPAL - Desktop: flex-row, Mobile: flex-col */}
      <div className="flex flex-col lg:flex-row h-full w-full">
        
        {/* SECCIÓN DEL VIDEO - Desktop: dinámico según chat, Mobile: full width */}
        <motion.div 
          className="flex flex-col bg-zinc-900 transition-all duration-500"
          style={{ 
            flex: videoFlexValue,
            minWidth: 0
          }}
          animate={{ opacity: 1 }}
        >
          {/* Header del video - Mobile y Desktop */}
          <div className="flex items-center justify-between p-3 lg:p-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white border-2 border-zinc-900 text-zinc-900 hover:bg-cyan-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
              
              {totalItems > 1 && (
                <div className="flex items-center gap-1 px-3 py-2 bg-white border-2 border-zinc-900">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onPrev}
                    disabled={!onPrev}
                    className="p-1 text-zinc-900 hover:text-cyan-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-4 h-4" />
                  </motion.button>
                  <span className="text-xs text-zinc-900 min-w-[60px] text-center font-bold">
                    {currentIndex + 1} / {totalItems}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onNext}
                    disabled={!onNext}
                    className="p-1 text-zinc-900 hover:text-cyan-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>
            
            {/* Botón toggle chat - Solo visible en móvil */}
            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileChatOpen(!mobileChatOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-400 border-2 border-zinc-900 text-zinc-900 font-bold text-sm"
              >
                {mobileChatOpen ? (
                  <>
                    <MessageSquareOff className="w-4 h-4" />
                    <span>Ocultar Chat</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Mostrar Chat</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Reproductor de Video */}
          <div className="shrink-0 p-2 lg:p-8 flex items-center justify-center bg-zinc-900">
            <div className="relative w-full max-w-5xl border-2 lg:border-4 border-zinc-900 bg-black" style={{ aspectRatio: '16/9' }}>
              {getYouTubeId(media.url || '') ? (
                <>
                  <YouTube
                    videoId={getYouTubeId(media.url || '') || ''}
                    opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, rel: 0 } }}
                    onPause={handleVideoPause}
                    onPlay={handleVideoPlay}
                    onReady={handleVideoReady}
                    onStateChange={handleVideoStateChange}
                    className="absolute inset-0 w-full h-full"
                  />
                  <AnimatePresence>
                    {isPaused && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => youtubePlayer?.playVideo()}
                        className="absolute inset-0 z-20 bg-gradient-to-b from-transparent from-0% via-zinc-900/80 via-50% to-zinc-900 to-85% flex flex-col items-center justify-center cursor-pointer group"
                      >
                        <motion.div
                          initial={{ scale: 0.8, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          className="flex flex-col items-center group-hover:scale-105 transition-transform duration-300"
                        >
                          <Sparkles className="w-16 h-16 text-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-[2px_2px_0px_#00ffff]">
                            TutorVideoIA
                          </h2>
                          <div className="flex items-center gap-2 mt-4 text-cyan-400 bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700">
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-widest">
                              Haz clic para continuar
                            </span>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : media?.url ? (
                <iframe
                  src={media.url}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <div className="text-center p-8">
                    <p className="text-zinc-400 mb-4">No se puede reproducir este video</p>
                    {media?.url && (
                      <a 
                        href={media.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Ver en fuente original
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info del video y videos sugeridos - Solo visible en Desktop */}
          <motion.div 
            className="hidden lg:block p-3 lg:p-4 bg-zinc-800 border-t-2 border-zinc-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-sm lg:text-base truncate">{media.title}</h2>
                <p className="text-zinc-400 text-xs mt-0.5 truncate">{media.description}</p>
              </div>
              
              {totalItems > 1 && (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onPrev}
                    disabled={!onPrev}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-zinc-900 text-zinc-900 hover:shadow-[4px_4px_0px_#00ffff] transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Anterior</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    disabled={!onNext}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-400 border-2 border-zinc-900 text-zinc-900 hover:shadow-[4px_4px_0px_#ff00ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    <span className="text-sm">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>
            
            {suggestedVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 pt-2 border-t-2 border-zinc-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-zinc-300 font-bold uppercase">Videos sugeridos</span>
                </div>
                <div className="suggested-videos-scroll">
                  {suggestedVideos.map((video) => (
                    <SuggestedVideoCard
                      key={video.id}
                      media={video}
                      onClick={() => handleSelectSuggested(video)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* SECCIÓN DEL CHAT - Solo se renderiza una versión según el dispositivo */}
        
        {/* Chat Desktop - Barra lateral derecha - Solo cuando NO es móvil */}
        {!isMobile && (
          <>
            <motion.div
              initial={{ width: 400, opacity: 0, x: 50 }}
              animate={{ 
                width: chatOpen ? 400 : 0, 
                opacity: chatOpen ? 1 : 0,
                x: chatOpen ? 0 : 100
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex bg-white border-l-2 border-zinc-900 flex-col overflow-hidden"
              style={{ 
                flex: '1 1 0',
                maxWidth: 400,
                minWidth: 0,
                height: '100vh'
              }}
            >
              <ChatPanel
                messages={messages}
                inputValue={inputValue}
                setInputValue={setInputValue}
                isLoading={isLoading}
                hasSummary={hasSummary}
                isExporting={isExporting}
                messagesEndRef={messagesEndRef}
                onSendMessage={handleSendMessage}
                onKeyDown={handleKeyDown}
                onSummary={handleAutoSummary}
                onGeneratePDF={generatePDF}
                onToggleChat={() => setChatOpen(false)}
                onInternalSearch={onInternalSearch}
                onSelectMedia={onSelectMedia}
                getYouTubeId={getYouTubeId}
                isLoadingTranscript={isLoadingTranscript}
              />
            </motion.div>

            {/* Botón flotante para mostrar chat - Solo Desktop cuando chat está oculto */}
            <AnimatePresence>
              {!chatOpen && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChatOpen(true)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white border-2 border-zinc-900 text-zinc-900 hover:shadow-[4px_4px_0px_#00ffff] transition-all z-20"
                >
                  <Sparkles className="w-5 h-5 text-cyan-500" />
                </motion.button>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Chat Móvil - Panel inferior - Solo cuando ES móvil */}
        {isMobile && (
          <AnimatePresence>
            {mobileChatOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col flex-1 min-h-0 bg-white border-t-4 border-zinc-900 overflow-hidden"
              >
                <ChatPanel
                  messages={messages}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  isLoading={isLoading}
                  hasSummary={hasSummary}
                  isExporting={isExporting}
                  isLoadingTranscript={isLoadingTranscript}
                  messagesEndRef={messagesEndRef}
                  onSendMessage={handleSendMessage}
                  onKeyDown={handleKeyDown}
                  onSummary={handleAutoSummary}
                  onGeneratePDF={generatePDF}
                  onToggleChat={() => setMobileChatOpen(false)}
                  onInternalSearch={onInternalSearch}
                  onSelectMedia={onSelectMedia}
                  getYouTubeId={getYouTubeId}
                  isMobile
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

interface ChatPanelProps {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  hasSummary: boolean;
  isExporting: boolean;
  isLoadingTranscript?: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSummary: () => void;
  onGeneratePDF: () => void;
  onToggleChat: () => void;
  onInternalSearch?: (query: string) => void;
  onSelectMedia?: (media: UnifiedMedia) => void;
  getYouTubeId: (url: string) => string | null;
  isMobile?: boolean;
}

function ChatPanel({
  messages,
  inputValue,
  setInputValue,
  isLoading,
  hasSummary,
  isExporting,
  isLoadingTranscript = false,
  messagesEndRef,
  onSendMessage,
  onKeyDown,
  onSummary,
  onGeneratePDF,
  onToggleChat,
  onInternalSearch,
  onSelectMedia,
  getYouTubeId,
  isMobile = false
}: ChatPanelProps) {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b-2 border-zinc-900 bg-zinc-100 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-500" />
          <span className="text-zinc-900 font-bold">Tutor IA</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleChat}
          className="p-1 border-2 border-zinc-900 bg-white hover:bg-zinc-100 text-zinc-700"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {isLoadingTranscript && (
        <div className="flex items-center justify-center p-3 bg-cyan-50 border-b border-cyan-200">
          <Loader2 className="w-4 h-4 text-cyan-500 animate-spin mr-2" />
          <span className="text-sm text-cyan-700 font-medium">Obteniendo transcripción del video...</span>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-white min-h-0 ${isMobile ? '' : ''}`}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              key="empty-chat-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <MessageCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">
                ¡Hola! Soy tu tutor de TutorVideoIA. 
                Hazme preguntas sobre el video o usa el botón &quot;Hacer Resumen&quot; para obtener un análisis completo.
              </p>
            </motion.div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={`${message.id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 border-2 ${
                  message.role === 'user'
                    ? 'bg-cyan-400 border-zinc-900 text-zinc-900'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h2: ({children}) => <h2 className="text-lg font-bold text-cyan-600 mt-6 mb-3 pb-1 border-b border-zinc-200">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-bold text-cyan-600 mt-3 mb-2">{children}</h3>,
                        strong: ({children}) => <strong className="font-bold text-zinc-900">{children}</strong>,
                        p: ({children}) => <p className="mb-4 leading-relaxed text-zinc-700">{children}</p>,
                        ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-zinc-700">{children}</ul>,
                        li: ({children}) => <li className="text-zinc-700">{children}</li>,
                        a: ({href, children}) => {
                          const handleClick = (e: React.MouseEvent) => {
                            e.preventDefault();
                            if (!href) return;
                            
                            if (href.includes('search_query=')) {
                              const url = new URL(href);
                              const query = url.searchParams.get('search_query') || '';
                              const cleanQuery = query.replace(/\+/g, ' ');
                              if (onInternalSearch) {
                                onInternalSearch(cleanQuery);
                              }
                            } else if (href.includes('youtube.com/watch') || href.includes('youtu.be/')) {
                              const videoId = getYouTubeId(href);
                              if (videoId && onSelectMedia) {
                                const newMedia: UnifiedMedia = {
                                  id: videoId,
                                  title: 'Video de YouTube',
                                  url: href,
                                  thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                                  description: '',
                                  source: 'youtube',
                                  category: 'documental',
                                };
                                onSelectMedia(newMedia);
                              }
                            } else {
                              window.open(href, '_blank', 'noopener,noreferrer');
                            }
                          };
                          return (
                            <button 
                              onClick={handleClick} 
                              className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-cyan-100 border border-cyan-400 rounded text-cyan-700 hover:bg-cyan-200 transition-colors cursor-pointer text-xs font-medium"
                            >
                              <span>🔍</span>
                              <span>{children}</span>
                            </button>
                          );
                        }
                      }}
                    >
                      {message.content.replace(/^\`\`\`(markdown)?\s*/i, '').replace(/\`\`\`\s*$/i, '')}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              key="loading-indicator-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-100 border-2 border-zinc-300 p-3">
                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-3 lg:p-4 border-t-2 border-zinc-900 bg-zinc-50 shrink-0 ${isMobile ? 'rounded-t-2xl' : ''}`}>
        <div className="flex flex-col gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu pregunta..."
            rows={2}
            className="w-full bg-transparent text-zinc-900 placeholder:text-zinc-400 px-2 py-2 resize-none focus:outline-none text-sm"
          />
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSummary}
                disabled={isLoading || hasSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-zinc-300 rounded-full text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasSummary ? '✓ Resumen' : '📝 Resumen'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGeneratePDF}
                disabled={messages.length === 0 || isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-zinc-300 rounded-full text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generando...</span></>
                ) : (
                  <><Download className="w-3.5 h-3.5" /><span>PDF</span></>
                )}
              </motion.button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center justify-center p-2.5 bg-cyan-400 border-2 border-zinc-900 text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-300 transition-all rounded-full"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
