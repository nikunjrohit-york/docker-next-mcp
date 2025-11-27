"use client";

import { useState, useTransition } from "react";
import { updateSettings, getSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";

interface SettingsFormProps {
    initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState("");

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            await updateSettings(formData);
            const newSettings = await getSettings();
            setSettings(newSettings);
            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    AI Provider
                </label>
                <select
                    name="provider"
                    defaultValue={settings.AI_PROVIDER || "local"}
                    key={settings.AI_PROVIDER}
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
                    defaultValue={settings.OPENAI_BASE_URL || "http://localhost:11434/v1"}
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
                    defaultValue={settings.OPENAI_API_KEY || ""}
                    key={settings.OPENAI_API_KEY}
                    placeholder="sk-..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
            </div>

            <div className="flex items-center justify-between pt-4">
                <Button type="submit" isLoading={isPending}>
                    {isPending ? "Saving..." : "Save Settings"}
                </Button>
                {message && (
                    <span className="text-green-400 text-sm animate-fade-in">
                        {message}
                    </span>
                )}
            </div>
        </form>
    );
}
