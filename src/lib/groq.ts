const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_TUTOR_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
];

const DEFAULT_TAGGER_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'allam-2-7b',
];

export type GroqMessage = { role: string; content: string };

export type ChatCompletionResult = {
  model: string;
  content: string;
  reasoning?: string;
  completionTokens?: number;
};

type FetchResult =
  | { ok: true; result: ChatCompletionResult }
  | { ok: false; model: string; reason: string; fatal: boolean };

function resolveModels(envValue: string | undefined, defaults: string[]): string[] {
  if (!envValue) return defaults;
  const parsed = envValue
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : defaults;
}

function isFatalStatus(status: number): boolean {
  return status === 401 || status === 403;
}

async function tryModel(
  model: string,
  apiKey: string,
  messages: GroqMessage[],
  options: { temperature: number; maxTokens: number },
  timeoutMs: number
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const fatal = isFatalStatus(response.status);
      const detail = errorText.slice(0, 300);
      console.warn(
        `[groq] ${model} fallo HTTP ${response.status}${fatal ? ' (fatal)' : ' -> probando siguiente'}: ${detail}`
      );
      return {
        ok: false,
        model,
        reason: `HTTP ${response.status}: ${detail}`,
        fatal,
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = typeof message?.content === 'string' ? message.content.trim() : '';

    if (!content) {
      return {
        ok: false,
        model,
        reason: 'respuesta vacia (el modelo consumio max_tokens en razonamiento)',
        fatal: false,
      };
    }

    return {
      ok: true,
      result: {
        model,
        content,
        reasoning: message?.reasoning ?? undefined,
        completionTokens: data.usage?.completion_tokens,
      },
    };
  } catch (error) {
    const messageText =
      error instanceof Error
        ? error.name === 'AbortError'
          ? `timeout tras ${timeoutMs}ms`
          : error.message
        : String(error);
    console.warn(`[groq] ${model} fallo de red: ${messageText}`);
    return { ok: false, model, reason: messageText, fatal: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function chatWithFallback(params: {
  models: string | undefined;
  defaults: string[];
  apiKey: string;
  messages: GroqMessage[];
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
}): Promise<ChatCompletionResult | null> {
  const chain = resolveModels(params.models, params.defaults);
  const failures: string[] = [];

  for (const model of chain) {
    const attempt = await tryModel(model, params.apiKey, params.messages, {
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    }, params.timeoutMs ?? 30000);

    if (attempt.ok) {
      if (failures.length > 0) {
        console.warn(`[groq] recuperado con ${model} tras: ${failures.join(' | ')}`);
      }
      return attempt.result;
    }

    failures.push(`${model}: ${attempt.reason}`);
    if (attempt.fatal) {
      console.error(`[groq] error no recuperable, cortando cadena: ${attempt.reason}`);
      break;
    }
  }

  console.error(`[groq] todos los modelos fallaron -> ${failures.join(' | ')}`);
  return null;
}