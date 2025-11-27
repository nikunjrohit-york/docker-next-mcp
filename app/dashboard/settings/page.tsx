'use client';

import { useState, useEffect, useTransition } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState('');

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            await updateSettings(formData);
            const newSettings = await getSettings();
            setSettings(newSettings);
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        });
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">AI Provider Configuration</h2>

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            AI Provider
                        </label>
                        <select
                            name="provider"
                            defaultValue={settings.AI_PROVIDER || 'local'}
                            key={settings.AI_PROVIDER} // Force re-render when settings load
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="local">Local (Ollama)</option>
                            <option value="cloud">Cloud (OpenAI)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Ollama Base URL (for Local)
                        </label>
                        <input
                            name="ollamaUrl"
                            defaultValue={settings.OPENAI_BASE_URL || 'http://localhost:11434/v1'}
                            key={settings.OPENAI_BASE_URL}
                            placeholder="http://localhost:11434/v1"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            OpenAI API Key (for Cloud)
                        </label>
                        <input
                            name="openaiKey"
                            type="password"
                            defaultValue={settings.OPENAI_API_KEY || ''}
                            key={settings.OPENAI_API_KEY}
                            placeholder="sk-..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 font-medium"
                        >
                            {isPending ? 'Saving...' : 'Save Settings'}
                        </button>
                        {message && (
                            <span className="text-green-400 text-sm animate-fade-in">
                                {message}
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
