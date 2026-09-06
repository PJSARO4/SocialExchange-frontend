/**
 * Caption generation for automated posts.
 *
 * Modes:
 *  - filename : prettify the file name into a human caption (+ hashtags)
 *  - template : fill a user template, {name} -> prettified file name
 *  - ai       : call a self-hosted Ollama instance if OLLAMA_URL is set,
 *               otherwise fall back to the filename caption (no paid LLM)
 */

export type CaptionMode = 'filename' | 'template' | 'ai';

export interface CaptionInput {
  mode: CaptionMode;
  fileName: string;
  template?: string;
  hashtags?: string[];
  aiPrompt?: string;
}

export function prettifyName(fileName: string): string {
  const base = fileName.replace(/\.[a-z0-9]+$/i, '');
  const words = base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!words) return '';
  return words
    .split(' ')
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function withHashtags(text: string, hashtags?: string[]): string {
  if (!hashtags || hashtags.length === 0) return text;
  const tags = hashtags
    .map((h) => (h.startsWith('#') ? h : `#${h.replace(/[^a-z0-9_]/gi, '')}`))
    .filter(Boolean)
    .join(' ');
  return tags ? `${text}\n\n${tags}` : text;
}

async function ollamaCaption(prompt: string): Promise<string | null> {
  const base = process.env.OLLAMA_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        prompt,
        stream: false,
      }),
      // don't let a slow local box hang the whole batch
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const out = (data.response || '').trim();
    return out || null;
  } catch {
    return null;
  }
}

export async function generateCaption(input: CaptionInput): Promise<string> {
  const pretty = prettifyName(input.fileName);

  if (input.mode === 'template' && input.template) {
    return withHashtags(input.template.replace(/\{name\}/gi, pretty), input.hashtags);
  }

  if (input.mode === 'ai') {
    const prompt =
      input.aiPrompt?.trim() ||
      `Write a short, punchy, funny Instagram caption (max 2 sentences, no emojis unless natural) for a meme post titled "${pretty}". Return only the caption.`;
    const ai = await ollamaCaption(prompt);
    if (ai) return withHashtags(ai, input.hashtags);
    // fall through to filename caption when Ollama isn't reachable
  }

  return withHashtags(pretty, input.hashtags);
}

/** Guess an Instagram media type from a Drive mime type. */
export function mediaTypeFromMime(mime: string): 'IMAGE' | 'VIDEO' | 'REELS' {
  if (/video\//i.test(mime)) return 'REELS';
  return 'IMAGE';
}
