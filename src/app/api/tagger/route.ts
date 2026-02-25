import { NextResponse } from 'next/server';

const TAGGER_MODEL = 'liquid/lfm-2.5-1.2b-instruct:free';

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((t: { text: string }) => t.text).join(' ').substring(0, 6000);
  } catch {
    return "Transcripción no disponible.";
  }
}

function extractCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('documental') || text.includes('documentary') || text.includes('historia')) return 'Documental';
  if (text.includes('ciencia') || text.includes('science') || text.includes('física') || text.includes('química') || text.includes('biology')) return 'Ciencia';
  if (text.includes('ópera') || text.includes('opera') || text.includes('sinfon') || text.includes('classical')) return 'Ópera';
  if (text.includes('podcast') || text.includes('entrevista') || text.includes('interview')) return 'Podcast';
  if (text.includes('tutorial') || text.includes('how to') || text.includes('cómo') || text.includes('curso')) return 'Tutorial';
  if (text.includes('concert') || text.includes('concierto') || text.includes('live music')) return 'Concierto';
  if (text.includes('art') || text.includes('arte') || text.includes('museum')) return 'Arte';
  if (text.includes('movie') || text.includes('película') || text.includes('film')) return 'Película';
  if (text.includes('simpson') || text.includes('entretenimiento') || text.includes('serie')) return 'Entretenimiento';
  
  return 'Educativo';
}

function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags: string[] = [];
  
  const keywords = [
    'historia', 'history', 'science', 'ciencia', 'nature', 'naturaleza',
    'technology', 'tecnología', 'art', 'arte', 'music', 'música',
    'physics', 'física', 'chemistry', 'química', 'biology', 'biología',
    'math', 'matemáticas', 'philosophy', 'filosofía', 'psychology',
    'documentary', 'documental', 'education', 'educación', 'tutorial',
    'space', 'espacio', 'universe', 'universo', 'earth', 'tierra'
  ];
  
  keywords.forEach(keyword => {
    if (text.includes(keyword) && tags.length < 5) {
      tags.push(keyword);
    }
  });
  
  if (tags.length === 0) {
    tags.push('video', 'educativo');
  }
  
  return tags;
}

export async function POST(req: Request) {
  try {
    const { videoId, title, description } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ 
        tags: ['video'], 
        category: 'Educativo' 
      });
    }

    console.log(`🏷️ CEREBRO 2 (Tagger): Analizando video ${videoId}`);
    
    const transcriptText = await fetchTranscript(videoId);
    const apiKey = process.env.OPENROUTER_API_KEY;

    // Si no hay API key, usar extracción local
    if (!apiKey) {
      console.log('⚠️ Sin API key, usando extracción local de tags');
      return NextResponse.json({
        tags: extractTags(title || '', description || ''),
        category: extractCategory(title || '', description || '')
      });
    }

    const systemPrompt = `Eres un clasificador de videos educativos. Analiza este video y genera etiquetas.

Título: ${title || 'Sin título'}
Descripción: ${(description || '').substring(0, 300)}
Transcripción: ${transcriptText.substring(0, 3000)}

CATEGORÍAS VÁLIDAS: Documental, Ciencia, Ópera, Podcast, Tutorial, Concierto, Arte, Película, Educativo

Responde SOLO con JSON válido (sin markdown, sin explicaciones):
{"tags": ["tag1", "tag2", "tag3"], "category": "Categoría"}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'Content-Type': 'application/json',
          'X-Title': 'VIDOZCHOOL Tagger',
        },
        body: JSON.stringify({
          model: TAGGER_MODEL,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.1,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Intentar parsear JSON de la respuesta
        try {
          // Limpiar la respuesta de posibles caracteres extra
          const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
          const jsonMatch = cleanContent.match(/\{[^}]+\}/);
          
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            console.log(`✅ Tagger generó: ${result.tags?.length || 0} tags, categoría: ${result.category}`);
            return NextResponse.json({
              tags: result.tags || ['video'],
              category: result.category || 'Educativo'
            });
          }
        } catch {
          console.log('⚠️ Error parseando JSON del tagger');
        }
      }
    } catch {
      console.log('⚠️ Error en API del tagger');
    }

    // Fallback: extracción local
    return NextResponse.json({
      tags: extractTags(title || '', description || ''),
      category: extractCategory(title || '', description || '')
    });

  } catch (error) {
    console.error('Tagger Error:', error);
    return NextResponse.json({ 
      tags: ['video', 'educativo'], 
      category: 'Educativo' 
    });
  }
}
