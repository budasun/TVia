import { NextResponse } from 'next/server';
import type { UnifiedMedia, MediaCategory, CategoryFilter } from '@/types';
import YouTube from 'youtube-sr';

const searchCache = new Map<string, { timestamp: number; data: UnifiedMedia[] }>();
const CACHE_DURATION = 1000 * 60 * 60 * 2;

const SIMPSONS_EPISODES: UnifiedMedia[] = [
  { id: 'simpsons-11x22', title: '11x22 - Detrás de la Risa', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw6gfRyMw7YltagLuwS26QswYaAgIPbCZYMJpgSIIDIVuCXbIYiKU5alYYe-hJ4AAS9nS7d8J9pFrqYQygMqP3mzNzBKEGnC9YhoPNZ-TUy7UJ8eeNsVBnt6-qzOsUkvS7hYDjG', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 22', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x21', title: '11x21 - Marge está loca...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzNVK8xyDM-ozoffsWdEVpbTzEVQpnNgkRVTiFsQP9lHiNUMwprX40Wwy7_WsT9kraCkCQPsCrO6U6GWGuV1YOil4y2V8NENETaISn3tbk26tezsyt4L0huWQ3J0McGJSW0DXQ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 21', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x20', title: '11x20 - El Último Tango...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzrPObbf3cjYgmX-e3InrQSWwLrbj7lCzM6JW7XPUkmozkQlBCsmS9pivCanxpGC12bvqV6SQRkvyg57sA0njBn5XeCvceaoWRunAWHH3uwUr1imQ6VyQdTfwydQuuGTV9ju-M', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 20', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x19', title: '11x19 - Mata al cocodrilo...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxJN0Jb5V8NZAd65ipsGibdpdpoiAGS4nPFjTLeZHWkwOSlnqcY2zE4_t6yNwWagsFYaqBeOINuFGtmLv4A7eYwB_2IwgXaKj2OaufPt38styYBajhE9S6a8ahAj_s6TAC3SWGe', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 19', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x18', title: '11x18 - Días de Vino y Rosas', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dwCNiPkJSVj4caUkCUiW0Sn0dkYI6DeP1HVBbOj1lYguymRkAWf5QSmCZRWfn9MZhfhzh2JuQoav97V1L0dCEwaBdOU_KNY98CEVGIMY6mwBn0joCz2eoXTPiQnzcIebFs0j9nJ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 18', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x17', title: '11x17 - Bart al Futuro', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxwfHAxqBfBsZKdtgK-u8ZKs6l3xuVdi9oyMcDj18GHhUD_mCRjpZ2_wcjrPZNKL7p5baiugbZ7BApGNxpBWZ0CaPNHmIPtcNJSdHFgfqstmb7pdprW5T1sgE7nNQEN3-G8MkA', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 17', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x16', title: '11x16 - Pigmoelion', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy0TmwpDZx4WHRnAPEPzGDUmvB4kOE2iPsZvN_t5wCnNE5a7ITdXv-wrYYjJNxunMcuBFg6omE00z_pzXLSg3GgFdf4-z7o1rYr5UY9-S7twMve3lJ4hjjAjhBd-I8yEEDcNw', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 16', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x15', title: '11x15 - Misionero Imposible', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dztJi3OY0D_vvdEmtZjoCUZqzzZkGypT-J8wo1jIUDcQ3VdEsZ-vLP1uZo22P9DhE42r_xCHX9GrqDpzCANw7eTeZI_7FjthzkgILe0G0v8bDwpIMmrvNCyEBYrw6nXWH7Iq38', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 15', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x14', title: '11x14 - Solo Nuevamentirijillo', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw0BytLbeqnmUuZjy-EJsMp2RC0tgfWPm3i1Ok1BY9pyO6y-jGtSAOtJQ8mzMjSNVxMj5Fcwci5kE383_LtiulRsmAsRSQz0RISUS598B3U96fJQ3kzttQQ8ARzNpALB_78tSVA', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 14', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x13', title: '11x13 - Jinetes Galácticos', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy1mz6QJL6Y4hoEpx1NB5-MFZduvHMEGqeg10X1elTBrYPObcVZTM6Y7CUpXP9zfemoVnLQD26Xqu9hWeJSkbGPcovGIqTQvCz_T6E-IATDNuqU2Tm2IvPf1WTnNRr5kyBeC7Ws', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 13', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x12', title: '11x12 - La Familia Mansión', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy6wYSTT0oVah2qcno4VHcHZLMu3DQpMODiOFtKN07nTuoE_0kU6SnMYt-aw1n70-rg3vYAT3xTQK_GRL8DryeLuGIM-QLmAuSXRm7Uamn4OQM6892D2r0PGeCzzJ13_ApS5msq', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 12', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x11', title: '11x11 - Pérdida de Fe', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxkprBku79AMVFKytsfq5iPSeXuwew3m-3hVpnZkYr_cB1Vi3YTID4O0Hk9uNX_T-EQH94U5LL2bWx1naEQ8jmjWnsZSU-g9tfwNk5WmN4nU2tfVSp5EH-nlHredb5Vlroaf6Y', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 11', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x10', title: '11x10 - La Pequeña Mamá', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy7DZAcfQEy5jMUtP8etnvHmAovEqBW6Cn11UsbRaxHUKyRACvw6pRwR9k6jWDfqjtQJSmggJmX0r8xh9dUerBUIJut0abXG9evajoLV4BLOMpdouu7BfuwJBJwvf7yfDlZpr7_', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 10', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x09', title: '11x09 - Un Gran Embaucador', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxZVJLZ8sLrOvA6KA90oBrdlFrd9P9SPp1agZ7oaFO3nkCeTu5NRLyhkdgf5GCKaemf0W_pcAemK-xbDfYTpO6Eswi9IfHGYwqU3X1iMjVCFw7WJpKnAPSz32GrHWplVpQG6LCu', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 9', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x08', title: '11x08 - Llévate a mi esposa', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxUEG7EAPC-Q85MTeiE960VjuW50EXWaITfzu4in715fxG_8w_-RzJBw7Ib61bmJrqeHr9oMGbvhVcwc2rsbHWYltopoCT8isbcunSdxc46YyxSU-AVvSRVI1S7ATy7-Axr3Q', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 8', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x07', title: '11x07 - Mal Comportamiento', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dwyVzAY948wFE6WqSlsAdYbAiszvFgqRMhg2o31gBCy5uT1CSnZXO8uLqicU62sTFmVa5girenNPLrDBddW_oi-XsQqjS_fo-7I0ldetLFdtJCyDH5xUf9gKfyvVECfCTv3FWs9', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 7', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x06', title: '11x06 - Hola Mamá, Hola Papá', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxPLmBg5-IdxxXMZM_v9630XvNtluD92asTDFIKZ7_Qaj3m456QdLCM7i_3Ncz7J3G9fO8jrqCs7-1Fb-O2nH6EjTT5WuGr83J58vy5jAfaoG35i7y6Oe2fy-P0--6nXHmjzmWw', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 6', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x05', title: '11x05 - Homero Granjero', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dz9o5DLPzutfBF0ZqbCJOOyMC-Ld5ijy0GYh68fUJy1hfcx0VYba5NUbpXOhQgszD5fzLSdvfdpd-SHQoCYmNQkAKoXYVrVuAiS_dqZEWdN_CwV4THcoecjl8vTyT2gPgeKaGY', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 5', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x04', title: '11x04 - Especial de Brujas 10', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dz8-KnRe7iE9B9LYDcvjGVJpNSSpq91iPbGe-oOi_9rNsijkZ4hD-2ApSf0iIqwqHAnjEqIhXVXhbk4WxWC4QXTIA76S8JXrtCcOV6DJRoadOBwdMcX5oVetjhSi2sS0JGoOA', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 4', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x03', title: '11x03 - Adivina quién viene...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw3h3p3Kp_62mHwJlrkLLiE2xuDECkVJrhFsoGydcadrb1PRMfoU41t9I54j66maZVvZqiS-6JvL13rCkmC_8dcZNMX83VbAM5Mvqma7CTWScy4WGCZmGFyjgaIPa7F-FfaIqs', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 3', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
];

const CATEGORY_QUERIES: Record<string, string[]> = {
  documental: ['documental completo', 'documentary', 'history documentary'],
  ciencia: ['ciencia explicada', 'science documentary', 'physics universe'],
  pelicula: ['pelicula completa', 'short film', 'cortometraje'],
  opera: ['opera completa', 'classical music concert', 'symphony orchestra'],
  podcast: ['entrevista completa', 'videopodcast', 'charla'], 
  tutorial: ['tutorial completo', 'curso gratis', 'masterclass'],
  conferencia: ['conference talk', 'conferencia', 'presentacion'],
  concepto: ['full concert HD', 'concierto en vivo', 'live concert full', 'classical concert'],
  arte: ['arte documental', 'art history', 'museum tour'],
  cortometraje: ['cortometraje festival de cine', 'award winning short film', 'cortometraje internacional arte', 'cannes short film'],
  entretenimiento: ['los simpsons capitulo completo', 'the simpsons full episode', 'simpsons serie completa'],
  concierto: ['concierto completo', 'live concert', 'concierto en vivo', 'classical music concert', 'symphony orchestra'],
};

const ALIASES: Record<string, string[]> = {
  'ia': ['inteligencia artificial', 'artificial intelligence', 'ia', 'ai'],
  'ai': ['artificial intelligence', 'inteligencia artificial', 'ai', 'ia'],
  'ux': ['user experience', 'experiencia de usuario', 'ux'],
  'ui': ['user interface', 'interfaz de usuario', 'ui'],
  '3d': ['tres dimensiones', '3d modeling', '3d'],
};

const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function detectCategory(title: string, description: string): MediaCategory {
  const text = normalizeText(`${title} ${description}`);
  if (text.includes('corto') || text.includes('short film') || text.includes('cortometraje')) return 'cortometraje';
  if (text.includes('documental') || text.includes('documentary') || text.includes('historia')) return 'documental';
  if (text.includes('ciencia') || text.includes('science') || text.includes('fisica')) return 'ciencia';
  if (text.includes('opera') || text.includes('sinfon')) return 'concierto';
  if (text.includes('podcast') || text.includes('entrevista') || text.includes('charla')) return 'podcast';
  if (text.includes('tutorial') || text.includes('how to') || text.includes('curso')) return 'tutorial';
  if (text.includes('art') || text.includes('arte') || text.includes('museo')) return 'arte';
  if (text.includes('pelicula') || text.includes('movie') || text.includes('film')) return 'pelicula';
  if (text.includes('simpson') || text.includes('entretenimiento')) return 'entretenimiento';
  return 'documental';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const category = (searchParams.get('category') as CategoryFilter) || 'all';
    const page = parseInt(searchParams.get('pageToken') || '0', 10);
    
    const cacheKey = `${query}-${category}`.toLowerCase();
    let allVideos: UnifiedMedia[] = [];

    if (searchCache.has(cacheKey) && (Date.now() - searchCache.get(cacheKey)!.timestamp < CACHE_DURATION)) {
      allVideos = searchCache.get(cacheKey)!.data;
    } else if (category === 'entretenimiento') {
      console.log('🕵️ Mezclando Blogger y YouTube Extendido para Entretenimiento...');
      
      let youtubeVideos: any[] = [];
      
      if (query === '') {
        // Matriz de Búsqueda Masiva para Entretenimiento
        const entertainmentQueries = [
          'capítulos completos los simpsons latino',
          'capítulos completos futurama latino',
          'capítulos completos padre de familia latino',
          'capítulos completos daria latino',
          'capítulos completos south park latino',
          'capítulos completos la casa de los dibujos latino',
          'capítulos completos malcolm el de en medio latino',
          'capítulos completos rick and morty latino'
        ];
        
        console.log(`🚀 Lanzando ${entertainmentQueries.length} hilos de búsqueda para Entretenimiento...`);
        const searchPromises = entertainmentQueries.map(q => 
          YouTube.search(q, { limit: 30, type: "video" }).catch(() => [])
        );
        
        const resultsMatrix = await Promise.all(searchPromises);
        const rawResults = resultsMatrix.flat();
        
        const uniqueMap = new Map();
        rawResults.forEach((v: { id?: string }) => {
          if (v.id && !uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
        });
        
        youtubeVideos = Array.from(uniqueMap.values());
        
        // Filtro Anti-Reacciones y Lista Negra de Canales
        youtubeVideos = youtubeVideos.filter((v: any) => {
          const channelName = (v.channel?.name || '').toLowerCase();
          const title = (v.title || '').toLowerCase();
          
          // Palabras bloqueadas en títulos o nombres de canal
          const blockedKeywords = ['reaccion', 'reacción'];
          // Lista negra de canales específicos (en minúsculas)
          const blockedChannels = ['reichanneltvv', 'loren reacciona', 'luigi primetv', 'some lopez', 'kira', 'kiradad', 'maria perez'];
          
          const hasBlockedKeyword = blockedKeywords.some(keyword => 
            channelName.includes(keyword) || title.includes(keyword)
          );
          
          const isBlockedChannel = blockedChannels.some(channel => 
            channelName.includes(channel)
          );

          return !hasBlockedKeyword && !isBlockedChannel;
        });
      } else {
        // Búsqueda específica del usuario dentro de entretenimiento
        const searchPromises = [
          YouTube.search(query, { limit: 40, type: "video" }).catch(() => []),
          YouTube.search(`${query} latino`, { limit: 40, type: "video" }).catch(() => []),
        ];
        const resultsMatrix = await Promise.all(searchPromises);
        const rawResults = resultsMatrix.flat();
        
        const uniqueMap = new Map();
        rawResults.forEach((v: { id?: string }) => {
          if (v.id && !uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
        });
        youtubeVideos = Array.from(uniqueMap.values());
        
        // Filtro Anti-Reacciones y Lista Negra de Canales
        youtubeVideos = youtubeVideos.filter((v: any) => {
          const channelName = (v.channel?.name || '').toLowerCase();
          const title = (v.title || '').toLowerCase();
          
          // Palabras bloqueadas en títulos o nombres de canal
          const blockedKeywords = ['reaccion', 'reacción'];
          // Lista negra de canales específicos (en minúsculas)
          const blockedChannels = ['reichanneltvv', 'loren reacciona', 'luigi primetv', 'some lopez', 'kira', 'kiradad', 'maria perez'];
          
          const hasBlockedKeyword = blockedKeywords.some(keyword => 
            channelName.includes(keyword) || title.includes(keyword)
          );
          
          const isBlockedChannel = blockedChannels.some(channel => 
            channelName.includes(channel)
          );

          return !hasBlockedKeyword && !isBlockedChannel;
        });
      }
      
      // Mapear al formato unificado de VIDEOSCHOOL
      youtubeVideos = youtubeVideos.map((v: any) => ({
        id: v.id || '',
        title: v.title || '',
        source: 'youtube' as const,
        url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : '',
        thumbnail: v.thumbnail?.url || (v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : ''),
        description: v.description || `Video de ${v.channel?.name || 'YouTube'}`,
        duration: v.durationFormatted || '',
        author: v.channel?.name || 'Desconocido',
        category: 'entretenimiento',
        tags: [],
        createdAt: new Date(),
        publishedAt: new Date().toISOString(),
        durationSeconds: 0,
      }));
      
      allVideos = query === '' ? [...SIMPSONS_EPISODES, ...youtubeVideos] : youtubeVideos;
      
      searchCache.set(cacheKey, { timestamp: Date.now(), data: allVideos });
      console.log(`💾 Guardado Entretenimiento Híbrido Expandido: ${allVideos.length} videos totales`);
    } else {
      console.log('🕵️ Iniciando Deep Matrix Scraping para:', cacheKey);

      // 2. TRADUCCIÓN DE ACRÓNIMOS PARA YOUTUBE
      const normQuery = query.toLowerCase();
      const queryForYoutube = ALIASES[normQuery] ? ALIASES[normQuery][0] : query;

      let baseStrings: string[] = [];
      if (query === '') {
        baseStrings = category === 'all' ? ['documentales educativos', 'ciencia explicada', 'cursos gratis'] : CATEGORY_QUERIES[category];
      } else {
        if (category === 'all') {
          baseStrings = [queryForYoutube, `${queryForYoutube} documental`, `${queryForYoutube} explicado`];
        } else {
          baseStrings = CATEGORY_QUERIES[category].map(catKw => `${queryForYoutube} ${catKw}`);
        }
      }

      // 3. MATRIZ DE VIAJE EN EL TIEMPO (El multiplicador masivo)
      // Añadimos sufijos para romper la "Burbuja del Top 20" de YouTube
      const modifiers = ['', '2026', '2025', 'nuevo']; 
      
      // Multiplicamos las 3 búsquedas base por los 4 modificadores = 12 Hilos de búsqueda
      const searchStrings = baseStrings.flatMap(base => 
        modifiers.map(mod => mod ? `${base} ${mod}` : base)
      );

      console.log(`🚀 Lanzando ${searchStrings.length} hilos de búsqueda para máxima cobertura...`);

      // 3.5 EXTRACCIÓN MASIVA 
      // Usamos limit: 30 por hilo. 12 hilos * 30 = 360 videos crudos solicitados.
      const searchPromises = searchStrings.map(searchStr => 
        YouTube.search(searchStr, { limit: 30, type: "video" }).catch(() => [])
      );
      
      const resultsMatrix = await Promise.all(searchPromises);
      const rawResults = resultsMatrix.flat();

      const uniqueMap = new Map();
      const stopWords = new Set(['de', 'el', 'la', 'en', 'un', 'una', 'los', 'las', 'por', 'con', 'para', 'del', 'que', 'se', 'su', 'al', 'y', 'o', 'a', 'to', 'of', 'in', 'and', 'for', 'the']);
      
      const baseKeywords = normQuery.split(' ').filter(word => word.length >= 2 && !stopWords.has(word));
      const keywords = baseKeywords.flatMap(kw => ALIASES[kw] ? ALIASES[kw] : [kw]).map(normalizeText);

      rawResults.forEach((v: { id?: string }) => {
        if (v.id && !uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
      });

      let filteredRaw = Array.from(uniqueMap.values());

      if (keywords.length > 0 && query !== 'documentales' && query !== '') {
        const strictFiltered = filteredRaw.filter((v: { title?: string; description?: string; channel?: { name?: string } }) => {
          const textToSearch = normalizeText(`${v.title} ${v.description || ''} ${v.channel?.name || ''}`);
          return keywords.some(kw => {
            if (kw.includes(' ')) return textToSearch.includes(kw);
            const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${safeKw}\\b`, 'i');
            return regex.test(textToSearch);
          });
        });

        if (strictFiltered.length >= 40) {
          filteredRaw = strictFiltered;
        } else {
          console.log(`⚠️ Filtro muy estricto (${strictFiltered.length} res). Activando Safe Fallback.`);
        }
      }

      allVideos = filteredRaw.map((v: { id?: string; title?: string; description?: string; thumbnail?: { url?: string }; channel?: { name?: string }; durationFormatted?: string }) => ({
        id: v.id || '',
        title: v.title || '',
        source: 'youtube' as const,
        url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : '',
        thumbnail: v.thumbnail?.url || (v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : ''),
        description: v.description || `Video de ${v.channel?.name || 'YouTube'}`,
        duration: v.durationFormatted || '',
        author: v.channel?.name || 'Desconocido',
        category: category !== 'all' ? category : detectCategory(v.title || '', v.description || ''),
        tags: [],
        createdAt: new Date(),
        publishedAt: new Date().toISOString(),
        durationSeconds: 0,
      }));
      
      searchCache.set(cacheKey, { timestamp: Date.now(), data: allVideos });
      console.log(`💾 Guardado MATRIX: ${cacheKey} (${allVideos.length} videos finales)`);
    }

    // Filtrado por duración
    const durationFilter = searchParams.get('duration');
    if (durationFilter && durationFilter !== 'any') {
      allVideos = allVideos.filter(v => {
        if (!v.duration) return false;
        
        const parts = v.duration.split(':').map(Number);
        let minutes = 0;
        if (parts.length === 3) {
          minutes = (parts[0] * 60) + parts[1];
        } else if (parts.length === 2) {
          minutes = parts[0];
        } else {
          minutes = 0;
        }

        if (durationFilter === '20-35') return minutes >= 20 && minutes <= 35;
        if (durationFilter === '36-60') return minutes >= 36 && minutes <= 60;
        if (durationFilter === '>60') return minutes > 60;
        return true;
      });
    }

    const PAGE_SIZE = 12;
    const startIndex = page * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedVideos = allVideos.slice(startIndex, endIndex);
    const hasMore = endIndex < allVideos.length;

    return NextResponse.json({
      media: paginatedVideos,
      total: allVideos.length,
      hasMore,
      nextPageToken: hasMore ? (page + 1).toString() : null,
    });
    
  } catch (error) {
    console.error('Error en el Motor Matrix:', error);
    return NextResponse.json({ error: 'Error al buscar videos.', media: [], hasMore: false, nextPageToken: null }, { status: 500 });
  }
}
