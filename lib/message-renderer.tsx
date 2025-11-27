import type { ReactNode } from 'react';

export interface NormalizedMessage {
  id?: string;
  role: string;
  text: string;
  toolInvocations: unknown[];
  isStreaming: boolean;
}

/**
 * Renders message content based on role and state
 */
export function renderMessageContent(
  m: NormalizedMessage,
  isLoading: boolean,
  messages: unknown[]
): ReactNode {
  const content = m.text || '';

  if (m.role === 'user') {
    return content ? <div className="whitespace-pre-wrap">{content}</div> : null;
  }

  const isAssistantStreaming = isLoading && messages.length && messages[messages.length - 1] === m;

  if (content || isAssistantStreaming) {
    return (
      <div className="whitespace-pre-wrap">
        {content || (isAssistantStreaming ? 'Thinking...' : '')}
      </div>
    );
  }

  const preview = getMessagePreview(m);
  return (
    <div className="whitespace-pre-wrap">{preview || <span className="opacity-50">...</span>}</div>
  );
}

/**
 * Generates a preview of the message for debugging
 */
export function getMessagePreview(m: NormalizedMessage): string {
  try {
    const jsonStr = JSON.stringify(m, null, 2);
    return jsonStr.slice(0, 300) + (jsonStr.length > 300) ? '…' : '';
  } catch {
    return '';
  }
}
