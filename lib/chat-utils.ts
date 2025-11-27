/**
 * Extracts text content from various message part formats.
 */
export const getTextFromParts = (parts: any): string => {
    if (!parts) return '';
    const flat = Array.isArray(parts) ? parts.flat(Infinity) : [parts];
    const texts: string[] = [];
    for (const p of flat) {
        if (p === null || p === undefined) continue;
        if (typeof p === 'string') {
            texts.push(p);
            continue;
        }
        // Common SDK shapes
        if (typeof p.delta === 'string') texts.push(p.delta);
        else if (typeof p.text === 'string') texts.push(p.text);
        else if (typeof p.content === 'string') texts.push(p.content);
        else if (typeof p.value === 'string') texts.push(p.value);
        else if (p.type === 'text' && typeof p.text === 'string') texts.push(p.text);
        else if (p.type === 'raw' && typeof p.data === 'string') texts.push(p.data);
        // tool-call and tool-result are not text parts in the message body
        else if (p.type === 'tool-call' || p.type === 'tool-result') continue;
        // unknown shape - ignore to keep UI clean
    }
    return texts.join('');
}

/**
 * Extracts the primary text content from a message object.
 */
export const getTextFromMessage = (m: any) => {
    if (!m) return '';
    // Priority: explicit content, then parts, then response messages, then tool results
    if (typeof m.content === 'string' && m.content.trim().length > 0) return m.content;

    const parts = m.parts || m.message?.parts || m.message?.chunks || m.chunks || m.message?.content;
    if (parts) return getTextFromParts(parts);

    if (m.response?.messages) {
        const assistantParts = m.response.messages
            .filter((x: any) => x.role === 'assistant')
            .flatMap((x: any) => x.content || []);
        const assistantText = getTextFromParts(assistantParts);
        if (assistantText) return assistantText;
    }

    if (Array.isArray(m.toolInvocations) && m.toolInvocations.length > 0) {
        return m.toolInvocations.map((t: any) => (typeof t.result === 'string' ? t.result : JSON.stringify(t.result || ''))).join('\n');
    }

    return '';
};

/**
 * Minimal tool invocation extractor: return existing SDK shape or a compact list from response.
 */
export const extractToolInvocations = (m: any) => {
    if (!m) return [];
    if (Array.isArray(m.toolInvocations) && m.toolInvocations.length > 0) return m.toolInvocations;
    if (!m.response?.messages || !Array.isArray(m.response.messages)) return [];
    const out: any[] = [];
    for (const msg of m.response.messages) {
        const contents = Array.isArray(msg.content) ? msg.content : (msg.content ? [msg.content] : []);
        for (const c of contents) {
            if (!c || !c.type) continue;
            if (c.type === 'tool-call' || c.type === 'tool-result') {
                const id = c.toolCallId || `call_${Math.random().toString(36).slice(2, 8)}`;
                out.push({ toolName: c.toolName, state: c.type === 'tool-call' ? 'call' : 'result', args: c.args ?? {}, result: c.result, toolCallId: id });
            }
        }
    }
    return out;
}

/**
 * Merge consecutive messages by role to avoid fragmentary streaming updates.
 */
export const normalizeMessages = (msgs: any[]) => {
    const normalized: any[] = [];
    for (const m of msgs) {
        if (!m) continue;
        const role = m.role || (m.message && m.message.role) || 'assistant';
        const text = getTextFromMessage(m) || '';
        const toolInvocations = extractToolInvocations(m) || [];

        const last = normalized[normalized.length - 1];
        if (last && last.role === role) {
            // Merge: append text, collect tool invocations
            if (text) last.text += text;
            if (toolInvocations.length > 0) last.toolInvocations.push(...toolInvocations);
            // Keep the most recent id for the merged message and update streaming flag
            last.id = m.id || last.id;
            last.isStreaming = !!m.isStreaming || !!last.isStreaming;
        } else {
            normalized.push({ id: m.id, role, text, toolInvocations, isStreaming: !!m.isStreaming });
        }
    }
    return normalized;
}
