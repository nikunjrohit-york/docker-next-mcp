'use client';

import { useEffect, useState } from 'react';
import { getSettings } from '@/app/actions/settings';
import { SettingsForm } from '@/components/settings/settings-form';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="p-8 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">AI Provider Configuration</h2>
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
