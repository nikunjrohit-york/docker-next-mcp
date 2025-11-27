'use client';

import { useChat } from '@ai-sdk/react';
import { normalizeMessages } from '@/lib/chat-utils';
import { renderMessageContent } from '@/lib/message-renderer';

export default function Dashboard() {
  const { messages, input, setInput, append, isLoading } = useChat();

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg mb-2">Welcome to InsightOne</p>
            <p className="text-sm">Ask questions about your codebase.</p>
            <p className="text-xs mt-4 text-gray-600">
              Try: "Hello!" or "What can you help me with?"
            </p>
          </div>
        )}

        {normalizeMessages(messages).map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                m.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'
              }`}
            >
              <div className="font-bold text-xs mb-1 opacity-50 uppercase tracking-wider">
                {m.role === 'user' ? 'You' : 'InsightOne'}
              </div>
              {renderMessageContent(m, isLoading, messages)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500 text-sm animate-pulse">Thinking...</div>
        )}

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
