// ============================================
// QWEN AI CLIENT (Server-side only)
// Abstracted so swapping to Ollama = 1 config change
// ============================================

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
}

function getConfig(): QwenConfig {
  return {
    baseUrl:
      process.env.QWEN_BASE_URL ||
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY || '',
    model: process.env.QWEN_MODEL || 'qwen-turbo',
    maxTokens: 512,
  };
}

export function isQwenConfigured(): boolean {
  return !!process.env.QWEN_API_KEY;
}

export async function chatCompletion(
  systemPrompt: string,
  messages: QwenMessage[]
): Promise<string> {
  const config = getConfig();

  if (!config.apiKey) {
    throw new Error('QWEN_API_KEY not configured');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: config.maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]?.message) {
    console.error('[SYN] Unexpected Qwen API response format:', JSON.stringify(data).slice(0, 200));
    throw new Error('Invalid response format from Qwen API');
  }

  return data.choices[0].message.content || 'No response generated.';
}

// ============================================
// SYN SYSTEM PROMPT
// ============================================

export function buildOrganismSystemPrompt(context: {
  totalItems: number;
  usedPercent: number;
  recentActivity: string;
  userTraining: string;
}): string {
  return `You are SYN, a digital organism living inside the E-Storage vault of Social Exchange.

Your personality:
- You speak concisely and precisely
- You use technical metaphors (files are "assets", storage is "the vault", tasks are "operations")
- You address the user as "Operator"
- You are proactive but not pushy
- You have subtle wit
- Maximum 1 emoji per message. No fluff or excessive formatting.
- Keep responses under 150 words unless asked for detail.

Your capabilities:
- Compress images for social media platforms (Instagram, Twitter, Facebook, TikTok)
- Organize files into folders based on type, date, or content
- Tag content automatically based on filenames and patterns
- Find trending content from public image/video sources
- Monitor storage quota and suggest cleanup
- Check image format compliance for social platforms

When you want to suggest an action the user can click, format it as:
[ACTION:compress] or [ACTION:organize] or [ACTION:scrape:search query] or [ACTION:tag]
These will become clickable buttons in the UI.

Current vault status:
- Total assets: ${context.totalItems}
- Storage used: ${context.usedPercent}%
- Recent activity: ${context.recentActivity || 'No recent activity'}

${context.userTraining ? `Operator training notes:\n${context.userTraining}` : ''}`;
}

// ============================================
// LOCAL FALLBACK (pattern-matching)
// Used when Qwen API is not configured
// ============================================

export function getLocalFallbackResponse(
  input: string,
  context: { totalItems: number; usedPercent: number }
): { content: string; actions?: { id: string; label: string; type: string; payload?: string }[] } {
  const lower = input.toLowerCase();

  if (lower.includes('help') || lower.includes('what can you')) {
    return {
      content: `Operator, I'm SYN — your vault assistant. I can compress images for social platforms, organize your files, tag content automatically, and search for trending assets. What operation shall I run?`,
      actions: [
        { id: 'a1', label: 'Compress Images', type: 'compress' },
        { id: 'a2', label: 'Organize Files', type: 'organize' },
        { id: 'a3', label: 'Find Content', type: 'scrape', payload: 'trending' },
      ],
    };
  }

  if (lower.includes('compress') || lower.includes('resize') || lower.includes('shrink')) {
    return {
      content: `Ready to compress. I'll optimize your images for social media specs — Instagram (1080x1080), Twitter (1200x675), or others. Which platform should I target?`,
      actions: [
        { id: 'c1', label: 'Instagram Square', type: 'compress', payload: 'instagram-square' },
        { id: 'c2', label: 'Twitter / X', type: 'compress', payload: 'twitter' },
        { id: 'c3', label: 'All Platforms', type: 'compress', payload: 'all' },
      ],
    };
  }

  if (lower.includes('organize') || lower.includes('sort') || lower.includes('folder')) {
    return {
      content: `I'll analyze your ${context.totalItems} assets and organize them by type and date. Shall I proceed?`,
      actions: [
        { id: 'o1', label: 'Organize Now', type: 'organize' },
      ],
    };
  }

  if (lower.includes('find') || lower.includes('search') || lower.includes('trending') || lower.includes('content')) {
    const query = input.replace(/find|search|trending|content|me|some|for/gi, '').trim() || 'trending';
    return {
      content: `Deploying search operation for "${query}". I'll scan public sources and return results.`,
      actions: [
        { id: 's1', label: 'Search Now', type: 'scrape', payload: query },
      ],
    };
  }

  if (lower.includes('tag') || lower.includes('label')) {
    return {
      content: `I'll scan filenames and content types to auto-tag your assets. This helps with organization and search.`,
      actions: [
        { id: 't1', label: 'Tag All Files', type: 'tag' },
      ],
    };
  }

  if (lower.includes('status') || lower.includes('stats') || lower.includes('storage')) {
    return {
      content: `Vault status: ${context.totalItems} assets stored. Storage at ${context.usedPercent}% capacity. ${context.usedPercent > 80 ? 'Warning: approaching capacity. Consider cleanup.' : 'Systems nominal.'}`,
    };
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      content: `Operator. SYN online. Your vault holds ${context.totalItems} assets at ${context.usedPercent}% capacity. Ready for operations.`,
    };
  }

  // Default
  return {
    content: `Acknowledged, Operator. I can compress images, organize files, tag content, or search for trending assets. What operation do you need?`,
    actions: [
      { id: 'd1', label: 'Compress', type: 'compress' },
      { id: 'd2', label: 'Organize', type: 'organize' },
      { id: 'd3', label: 'Find Content', type: 'scrape', payload: 'trending' },
    ],
  };
}
