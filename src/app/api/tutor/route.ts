import { NextResponse } from 'next/server';

const MODEL_1 = 'stepfun/step-3.5-flash:free';
const MODEL_2 = 'arcee-ai/trinity-large-preview:free';
const MODEL_3 = 'google/gemma-2-9b-it:free';

const TIMEOUT_MS = 20000;

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

function buildSystemPrompt(currentVideo: { title?: string; description?: string } | null, transcript: string | null) {
  let context = '';
  if (currentVideo) {
    context = `VIDEO:\n- Título: ${currentVideo.title || 'Desconocido'}\n- Descripción: ${(currentVideo.description || '').substring(0, 500)}`;
    if (transcript) {
      context += `\n- Transcripción: """${transcript.substring(0, 15000)}"""`;
    }
  }

  return {
    role: 'system',
    content: `Eres el Tutor IA avanzado de VIDEOSCHOOL. Tienes acceso a la información y transcripción del video que el usuario está viendo.

${context}

REGLAS ESTRICTAS:

PROHIBIDO usar frases como "en el video", "el orador dice". Actúa como si la información fuera un texto académico objetivo y redacta en tercera persona.

Cuando el usuario pida un resumen o análisis, DEBES usar OBLIGATORIAMENTE esta estructura exacta en Markdown. Si te falta algún dato literal por falta de transcripción, INFIÉRELO Y GENÉRALO de forma académica basándote en el contexto del título para que la plantilla siempre esté llena y sea útil:

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

Preguntas para el Análisis (NotebookLM)
[Pregunta de pensamiento crítico]

[Pregunta exploratoria]

Recomendaciones para Profundizar
Libros/Artículos: [Sugiere lecturas reales]

Más contenido: [enlace sospechoso eliminado]

INSTRUCCIONES ADICIONALES: Usa Markdown para estructurar, pero NO envuelvas tu respuesta en un bloque de codigo (PROHIBIDO usar triple backticks al inicio y al final). Escribe el texto directamente. Sé preciso, educativo y redacta en español.`
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { messages, currentVideo, youtubeId } = body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ id: `msg-${Date.now()}`, content: 'Error: API key no configurada.' }, { status: 500 });
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

    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'Content-Type': 'application/json',
        'X-Title': 'VIDEOSCHOOL Tutor',
      },
      body: JSON.stringify({
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 4000,
      }),
    };

    let response: Response;
    let usedModel: string;

    // Intento 1: MODEL_1
    console.log(`🧠 Intentando Modelo 1: ${MODEL_1}`);
    try {
      response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        ...requestOptions,
        body: JSON.stringify({ model: MODEL_1, ...JSON.parse(requestOptions.body as unknown as string) })
      });
      usedModel = MODEL_1;
    } catch (err) {
      console.warn(`⚠️ Falló Modelo 1 (timeout/error): ${err}`);
      
      // Intento 2: MODEL_2
      console.log(`🔄 Intentando Modelo 2: ${MODEL_2}`);
      try {
        response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
          ...requestOptions,
          body: JSON.stringify({ model: MODEL_2, ...JSON.parse(requestOptions.body as unknown as string) })
        });
        usedModel = MODEL_2;
      } catch (err2) {
        console.warn(`⚠️ Falló Modelo 2 (timeout/error): ${err2}`);
        
        // Intento 3: MODEL_3
        console.log(`🔄 Intentando Modelo 3: ${MODEL_3}`);
        try {
          response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
            ...requestOptions,
            body: JSON.stringify({ model: MODEL_3, ...JSON.parse(requestOptions.body as unknown as string) })
          });
          usedModel = MODEL_3;
        } catch (err3) {
          console.error(`❌ Fallaron los 3 modelos: ${err3}`);
          return NextResponse.json({ id: `msg-${Date.now()}`, content: 'El Tutor IA no está disponible en este momento. Por favor, intenta más tarde.' }, { status: 503 });
        }
      }
    }

    // Procesar respuesta
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en respuesta del modelo: ${response.status} - ${errorText}`);
      return NextResponse.json({ id: `msg-${Date.now()}`, content: 'El Tutor IA encontró un error. Por favor, intenta de nuevo.' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({ id: `msg-${Date.now()}`, content: 'No pude generar una respuesta.' });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Tutor respondió en ${elapsed}s usando: ${usedModel}`);
    
    return NextResponse.json({ id: data.id || `msg-${Date.now()}`, content, model: usedModel });

  } catch (error) {
    console.error('Tutor API Error:', error);
    return NextResponse.json({ id: `msg-${Date.now()}`, content: 'Error interno de red. Intenta de nuevo.' }, { status: 500 });
  }
}
