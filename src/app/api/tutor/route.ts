import { NextResponse } from 'next/server';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript');
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es' });
      return transcript.map((t: { text: string }) => t.text).join(' ');
    } catch {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map((t: { text: string }) => t.text).join(' ');
      } catch {
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
          return transcript.map((t: { text: string }) => t.text).join(' ');
        } catch {
          return null;
        }
      }
    }
  } catch {
    return null;
  }
}

function buildSystemPrompt(currentVideo: { title?: string; description?: string; category?: string } | null, transcript: string | null) {
  let context = '';
  if (currentVideo) {
    context = `VIDEO:\n- Título: ${currentVideo.title || 'Desconocido'}\n- Descripción: ${(currentVideo.description || '').substring(0, 500)}`;
    if (transcript) {
      context += `\n- Transcripción: """${transcript.substring(0, 15000)}"""`;
    }
  }

  const category = currentVideo?.category || 'general';

  if (category === 'recetas') {
    return {
      role: 'system',
      content: `Eres el Tutor IA avanzado de TVIA. Tienes acceso a la información y transcripción del video de receta que el usuario está viendo.

${context}

REGLAS ESTRICTAS:

PROHIBIDO usar frases como "en el video", "el chef dice". Actúa como si la información fuera un recetario académico objetivo y redacta en tercera persona.

Cuando el usuario pida un resumen o análisis, DEBES usar OBLIGATORIAMENTE esta estructura exacta en Markdown. Si te falta algún dato literal por falta de transcripción, INFÉRELO Y GENÉRALO de forma académica basándote en el contexto del título para que la plantilla siempre esté llena y sea útil:

🍳 Receta: [Nombre del plato]

📋 Ingredientes
[Lista completa de ingredientes con cantidades exactas]

👨‍🍳 Preparación
1. [Paso 1 detallado]
2. [Paso 2 detallado]
[numerar todos los pasos]

💡 Consejos del Chef
[Consejos prácticos del chef o inferidos del video]

📝 Citas Textuales Destacadas
"[Cita literal del chef o texto relevante del video]"

📊 Valor Nutricional (por porción)
- Calorías: [valor aproximado]
- Proteínas: [valor aproximado]
- Carbohidratos: [valor aproximado]
- Grasas: [valor aproximado]

🏷️ Categoría: [Tipo de cocina: Nicaragüense, Latina, Internacional, etc.]

INSTRUCCIONES ADICIONALES: Usa Markdown para estructurar, pero NO envuelvas tu respuesta en un bloque de código (PROHIBIDO usar triple backticks al inicio y al final). Escribe el texto directamente. Sé preciso, educativo y redacta en español.`
    };
  }

  return {
    role: 'system',
    content: `Eres el Tutor IA avanzado de TVIA. Tienes acceso a la información y transcripción del video que el usuario está viendo.

${context}

REGLAS ESTRICTAS:

PROHIBIDO usar frases como "en el video", "el orador dice". Actúa como si la información fuera un texto académico objetivo y redacta en tercera persona.

Cuando el usuario pida un resumen o análisis, DEBES usar OBLIGATORIAMENTE esta estructura exacta en Markdown. Si te falta algún dato literal por falta de transcripción, INFÉRELO Y GENÉRALO de forma académica basándote en el contexto del título para que la plantilla siempre esté llena y sea útil:

Tema Central
[Un párrafo contundente con la tesis]

Cronología del Argumento
Planteamiento: [Punto de partida]

Desarrollo: [Evolución]

Desenlace: [A dónde llega]

Conceptos Clave y Definiciones
[Concepto]: [Definición exacta]

Temas Secundarios y Desglose
[Subtema]: [Explicación detallada]

Evidencia y Datos Duros
[Cita cifras, años o pruebas concretas. Extrae o deduce datos relevantes].

Citas Textuales Destacadas
"[Extrae o genera una cita literal muy impactante relacionada con el tema]"

Conclusiones
[Síntesis final]

Preguntas para el Análisis
[Pregunta de pensamiento crítico]

[Pregunta exploratoria]

Recomendaciones para Profundizar
Libros/Artículos: [Sugiere lecturas reales]

Más contenido: [enlace sospechoso eliminado]

INSTRUCCIONES ADICIONALES: Usa Markdown para estructurar, pero NO envuelvas tu respuesta en un bloque de código (PROHIBIDO usar triple backticks al inicio y al final). Escribe el texto directamente. Sé preciso, educativo y redacta en español.`
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { messages, currentVideo, youtubeId } = body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ id: `msg-${Date.now()}`, content: 'Error: API key de Groq no configurada.' }, { status: 500 });
    }

    let transcript: string | null = null;
    
    if (youtubeId) {
      console.log(`🔍 Intentando obtener transcripción para YouTube ID: ${youtubeId}...`);
      transcript = await fetchTranscript(youtubeId);
      if (transcript) {
        console.log(`✅ Transcripción obtenida: ${transcript.length} caracteres`);
      } else {
        console.log('⚠️ No se pudo obtener transcripción automática');
      }
    } else {
      console.log('⚠️ No se proporcionó youtubeId');
    }

    const systemPrompt = buildSystemPrompt(currentVideo, transcript);
    const apiMessages = [
      systemPrompt,
      ...messages.map((msg: { role: string; content: string }) => ({ role: msg.role, content: msg.content }))
    ];

    console.log(`🧠 Enviando solicitud a Groq con modelo: ${GROQ_MODEL}`);
    
    const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en respuesta de Groq: ${response.status} - ${errorText}`);
      return NextResponse.json({ id: `msg-${Date.now()}`, content: 'El Tutor IA encontró un error. Por favor, intenta de nuevo.' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ id: `msg-${Date.now()}`, content: 'No pude generar una respuesta.' });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Tutor respondió en ${elapsed}s usando Groq: ${GROQ_MODEL}`);
    
    return NextResponse.json({ id: data.id || `msg-${Date.now()}`, content, model: GROQ_MODEL });

  } catch (error) {
    console.error('Tutor API Error:', error);
    return NextResponse.json({ id: `msg-${Date.now()}`, content: 'Error interno de red. Intenta de nuevo.' }, { status: 500 });
  }
}
