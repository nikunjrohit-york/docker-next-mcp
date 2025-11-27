'use client';

import { useChat } from '@ai-sdk/react';
import React from 'react';

export default function Dashboard() {
    const { messages, input, setInput, append, isLoading } = useChat();

    // (extractToolInvocations defined above) - keep single declaration

    const [debugMessagesMode, setDebugMessagesMode] = React.useState(false);

    React.useEffect(() => {
        // Optional: append ?debugMessages=1 to the dashboard URL to enable message logging
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const enabled = params.has('debugMessages');
        setDebugMessagesMode(enabled);
        if (!enabled) return;
        if (!messages || messages.length === 0) return;
        console.debug('[DEBUG] messages updated:', messages.map((m:any) => ({ id: m.id, role: m.role, content: m.content, parts: m.parts, toolInvocations: m.toolInvocations, normalizedToolInvocations: extractToolInvocations(m) })));
    }, [messages]);

    const getTextFromParts = (parts: any): string => {
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

    const getTextFromMessage = (m: any) => {
        if (!m) return '';
        // Priority: explicit content, then parts, then response messages, then tool results
        if (typeof m.content === 'string' && m.content.trim().length > 0) return m.content;

        const parts = m.parts || m.message?.parts || m.message?.chunks || m.chunks || m.message?.content;
        if (parts) return getTextFromParts(parts);

        if (m.response?.messages) {
            const assistantParts = m.response.messages
                .filter((x:any) => x.role === 'assistant')
                .flatMap((x:any) => x.content || []);
            const assistantText = getTextFromParts(assistantParts);
            if (assistantText) return assistantText;
        }

        if (Array.isArray(m.toolInvocations) && m.toolInvocations.length > 0) {
            return m.toolInvocations.map((t:any) => (typeof t.result === 'string' ? t.result : JSON.stringify(t.result || ''))).join('\n');
        }

        return '';
    };

    // Minimal tool invocation extractor: return existing SDK shape or a compact list from response
    const extractToolInvocations = (m: any) => {
        if (!m) return [];
        if (Array.isArray(m.toolInvocations) && m.toolInvocations.length > 0) return m.toolInvocations;
        if (!m.response?.messages || !Array.isArray(m.response.messages)) return [];
        const out: any[] = [];
        for (const msg of m.response.messages) {
            const contents = Array.isArray(msg.content) ? msg.content : (msg.content ? [msg.content] : []);
            for (const c of contents) {
                if (!c || !c.type) continue;
                if (c.type === 'tool-call' || c.type === 'tool-result') {
                    const id = c.toolCallId || `call_${Math.random().toString(36).slice(2,8)}`;
                    out.push({ toolName: c.toolName, state: c.type === 'tool-call' ? 'call' : 'result', args: c.args ?? {}, result: c.result, toolCallId: id });
                }
            }
        }
        return out;
    }

    // Merge consecutive messages by role to avoid fragmentary streaming updates
    const normalizeMessages = (msgs: any[]) => {
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

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-lg mb-2">Welcome to InsightOne</p>
                        <p className="text-sm">Ask questions about your codebase.</p>
                        <p className="text-xs mt-4 text-gray-600">Try: "Hello!" or "What can you help me with?"</p>
                    </div>
                )}

                {normalizeMessages(messages).map((m: any) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl p-4 rounded-lg ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}>
                            <div className="font-bold text-xs mb-1 opacity-50 uppercase tracking-wider">
                                {m.role === 'user' ? 'You' : 'InsightOne'}
                            </div>

                            {/* Render text content */}
                            {(() => {
                                const content = m.text || '';
                                // Always show the assistant message container. If there's no
                                // content yet, show a placeholder so the UI doesn't look broken.
                                if (m.role === 'user') {
                                    return content ? <div className="whitespace-pre-wrap">{content}</div> : null;
                                }

                                const toolInvocations = m.toolInvocations || [];
                                const toolResultText = (debugMessagesMode && toolInvocations && toolInvocations.length > 0) ?
                                    toolInvocations.map((t:any) => (typeof t.result === 'string' ? t.result : JSON.stringify(t.result || ''))).join('\n') : '';

                                const isAssistantStreaming = isLoading && messages.length && messages[messages.length - 1]?.id === m.id;
                                if (content || toolResultText || isAssistantStreaming) {
                                    const finalContent = (content || '') + (toolResultText ? '\n\n' + toolResultText : '');
                                    return <div className="whitespace-pre-wrap">{finalContent || (isAssistantStreaming ? 'Thinking...' : '')}</div>;
                                }

                                const preview = (() => {
                                    try {
                                        return JSON.stringify(m, null, 2).slice(0, 300) + (JSON.stringify(m, null, 2).length > 300 ? '…' : '');
                                    } catch {
                                        return '';
                                    }
                                })();

                                return (
                                    <div className="whitespace-pre-wrap">{preview || <span className="opacity-50">...</span>}</div>
                                );
                            })()}

                            {/* Render tool invocations */}
                            {(() => {
                                const toolInvocations = m.toolInvocations || [];
                                if (!debugMessagesMode) return null;
                                if (!toolInvocations || toolInvocations.length === 0) return null;
                                return (
                                    <div className="mt-2 space-y-2">
                                        {toolInvocations.map((tool: any, idx: number) => (
                                            <div key={idx} className="border border-gray-600 rounded p-3 bg-gray-900">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs bg-purple-600 px-2 py-1 rounded font-mono">
                                                        {tool.toolName}
                                                    </span>
                                                    {tool.state === 'call' && (
                                                        <span className="text-xs text-yellow-400">Calling...</span>
                                                    )}
                                                    {tool.state === 'result' && (
                                                        <span className="text-xs text-green-400">✓ Complete</span>
                                                    )}
                                                </div>
                                                {/* Show tool arguments if present */}
                                                {tool.args && Object.keys(tool.args).length > 0 && (
                                                    <div className="text-xs text-gray-400 mb-2">Args: {JSON.stringify(tool.args)}</div>
                                                )}
                                                {/* Show tool result if present */}
                                                {tool.result && (
                                                    <div className="mt-2">
                                                        <div className="text-xs text-gray-400 mb-1">Result:</div>
                                                        <pre className="text-xs bg-black p-2 rounded overflow-x-auto">
                                                            {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-center text-gray-500 text-sm animate-pulse">Thinking...</div>}

                {/* No dev debug UI */}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim()) {
                            append({ role: 'user', content: input });
                            setInput('');
                        }
                    }}
                    className="flex gap-2 max-w-4xl mx-auto"
                >
                    <input
                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your project (e.g., 'Hello!')..."
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
