import { createOpenAI } from '@ai-sdk/openai';

import { prisma } from '../db';

export async function getModel() {
  // Fetch settings from DB, fallback to env
  const settings = await prisma.systemSettings.findMany();
  const config = settings.reduce(
    (acc: Record<string, string>, curr: { key: string; value: string }) => {
      acc[curr.key] = curr.value;
      return acc;
    },
    {} as Record<string, string>
  );

  // Prefer environment variables for local development and CI overrides.
  const provider = process.env.AI_PROVIDER || config.AI_PROVIDER || 'local';

  if (provider === 'local') {
    const baseURL =
      config.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1';
    // Ollama doesn't validate API keys, but the SDK requires a value for
    // the Authorization header loader. Use the literal 'ollama' string here
    // to bypass the 'OPENAI_API_KEY missing' error while still routing
    // requests to the local `OPENAI_BASE_URL`.
    const localProvider = createOpenAI({
      baseURL,
      apiKey: 'ollama',
    });
    return localProvider('llama3.2');
  }

  // Cloud provider - requires OPENAI_API_KEY
  const apiKey = process.env.OPENAI_API_KEY || config.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required when AI_PROVIDER=cloud. Set OPENAI_API_KEY in .env or change AI_PROVIDER to local to use Ollama.'
    );
  }

  const openaiProvider = createOpenAI({
    apiKey,
  });

  return openaiProvider('gpt-4o-mini');
}

export async function getModelInfo() {
  const settings = await prisma.systemSettings.findMany();
  const config = settings.reduce(
    (acc: Record<string, string>, curr: { key: string; value: string }) => {
      acc[curr.key] = curr.value;
      return acc;
    },
    {} as Record<string, string>
  );
  const provider = process.env.AI_PROVIDER || config.AI_PROVIDER || 'local';
  const baseURL =
    config.OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1';
  const modelId = provider === 'local' ? 'llama3.2' : 'gpt-4o-mini';
  return { provider, baseURL, modelId };
}
