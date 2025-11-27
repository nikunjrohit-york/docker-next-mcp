interface MessagePart {
  delta?: string;
  text?: string;
  content?: string;
  value?: string;
  type?: string;
  data?: string;
}

/**
 * Extracts text from a single message part
 */
function extractTextFromPart(p: MessagePart | string): string | null {
  if (typeof p === 'string') return p;
  if (p === null || p === undefined) return null;

  // Check in order of specificity
  if (typeof p.delta === 'string') return p.delta;
  if (p.type === 'text' && typeof p.text === 'string') return p.text;
  if (p.type === 'raw' && typeof p.data === 'string') return p.data;
  if (typeof p.text === 'string') return p.text;
  if (typeof p.content === 'string') return p.content;
  if (typeof p.value === 'string') return p.value;

  // tool-call and tool-result are not text parts
  if (p.type === 'tool-call' || p.type === 'tool-result') return null;

  return null;
}

/**
 * Extracts text content from various message part formats.
 */
export const getTextFromParts = (parts: MessagePart | MessagePart[] | string): string => {
  if (!parts) return '';

  const flat = Array.isArray(parts) ? parts.flat(Number.POSITIVE_INFINITY) : [parts];
  const texts: string[] = [];

  for (const p of flat) {
    const text = extractTextFromPart(p);
    if (text) texts.push(text);
  }

  return texts.join('');
};

interface Message {
  content?: string;
  parts?: MessagePart[];
  message?: {
    parts?: MessagePart[];
    chunks?: MessagePart[];
    content?: MessagePart[];
    role?: string;
  };
  chunks?: MessagePart[];
  response?: {
    messages?: Array<{ role?: string; content?: MessagePart[] }>;
  };
  toolInvocations?: unknown[];
}

/**
 * Extracts text from response messages
 */
function getTextFromResponse(response: Message['response']): string {
  if (!response?.messages) return '';

  const assistantParts = response.messages
    .filter((x) => x.role === 'assistant')
    .flatMap((x) => x.content || []);

  return getTextFromParts(assistantParts);
}

/**
 * Extracts text from tool invocations
 */
function getTextFromToolInvocations(toolInvocations: unknown[]): string {
  return toolInvocations
    .map((t) => {
      const tool = t as { result?: string | Record<string, unknown> };
      return typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result || '');
    })
    .join('\n');
}

/**
 * Extracts the primary text content from a message object.
 */
export const getTextFromMessage = (m: Message) => {
  if (!m) return '';

  // Priority: explicit content first
  if (typeof m.content === 'string' && m.content.trim().length > 0) {
    return m.content;
  }

  // Then parts
  const parts = m.parts || m.message?.parts || m.message?.chunks || m.chunks || m.message?.content;
  if (parts) {
    return getTextFromParts(parts);
  }

  // Then response messages
  if (m.response?.messages) {
    const text = getTextFromResponse(m.response);
    if (text) return text;
  }

  // Finally tool results
  if (Array.isArray(m.toolInvocations) && m.toolInvocations.length > 0) {
    return getTextFromToolInvocations(m.toolInvocations);
  }

  return '';
};

interface ToolInvocation {
  toolName?: string;
  state?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  toolCallId?: string;
}

interface ToolContent {
  type?: string;
  toolName?: string;
  toolCallId?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

/**
 * Processes tool content and creates tool invocation
 */
function processToolContent(c: MessagePart): ToolInvocation | null {
  const toolContent = c as ToolContent;
  if (!toolContent?.type) return null;

  if (toolContent.type === 'tool-call' || toolContent.type === 'tool-result') {
    const id = toolContent.toolCallId || `call_${Math.random().toString(36).slice(2, 8)}`;
    return {
      toolName: toolContent.toolName,
      state: toolContent.type === 'tool-call' ? 'call' : 'result',
      args: toolContent.args ?? {},
      result: toolContent.result,
      toolCallId: id,
    };
  }

  return null;
}

/**
 * Extracts tool invocations from response messages
 */
function extractFromResponseMessages(
  messages: Array<{ role?: string; content?: MessagePart[] }>
): ToolInvocation[] {
  const out: ToolInvocation[] = [];

  for (const msg of messages) {
    const contents = Array.isArray(msg.content) ? msg.content : msg.content ? [msg.content] : [];

    for (const c of contents) {
      const invocation = processToolContent(c);
      if (invocation) out.push(invocation);
    }
  }

  return out;
}

/**
 * Minimal tool invocation extractor: return existing SDK shape or a compact list from response.
 */
export const extractToolInvocations = (m: Message): ToolInvocation[] => {
  if (!m) return [];

  if (Array.isArray(m.toolInvocations) && m.toolInvocations.length > 0) {
    return m.toolInvocations as ToolInvocation[];
  }

  if (m.response?.messages && Array.isArray(m.response.messages)) {
    return extractFromResponseMessages(m.response.messages);
  }

  return [];
};

interface NormalizedMessage {
  id?: string;
  role: string;
  text: string;
  toolInvocations: ToolInvocation[];
  isStreaming: boolean;
}

interface InputMessage extends Message {
  id?: string;
  role?: string;
  isStreaming?: boolean;
}

/**
 * Creates a new normalized message
 */
function createNormalizedMessage(m: InputMessage): NormalizedMessage {
  const role = m.role || m.message?.role || 'assistant';
  const text = getTextFromMessage(m) || '';
  const toolInvocations = extractToolInvocations(m) || [];

  return {
    id: m.id,
    role,
    text,
    toolInvocations,
    isStreaming: !!m.isStreaming,
  };
}

/**
 * Merges a message into the last normalized message
 */
function mergeIntoLast(
  last: NormalizedMessage,
  m: InputMessage,
  text: string,
  toolInvocations: ToolInvocation[]
): void {
  if (text) last.text += text;
  if (toolInvocations.length > 0) last.toolInvocations.push(...toolInvocations);
  last.id = m.id || last.id;
  last.isStreaming = !!m.isStreaming || !!last.isStreaming;
}

/**
 * Merge consecutive messages by role to avoid fragmentary streaming updates.
 */
export const normalizeMessages = (msgs: InputMessage[]): NormalizedMessage[] => {
  const normalized: NormalizedMessage[] = [];

  for (const m of msgs) {
    if (!m) continue;

    const role = m.role || m.message?.role || 'assistant';
    const text = getTextFromMessage(m) || '';
    const toolInvocations = extractToolInvocations(m) || [];

    const last = normalized[normalized.length - 1];

    if (last && last.role === role) {
      mergeIntoLast(last, m, text, toolInvocations);
    } else {
      normalized.push(createNormalizedMessage(m));
    }
  }

  return normalized;
};
