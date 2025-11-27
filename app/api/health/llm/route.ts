import { NextResponse } from 'next/server';

interface ModelResponse {
  name?: string;
  id?: string;
  model?: string;
  modelId?: string;
}

interface OllamaResponse {
  models?: ModelResponse[];
  tags?: (string | { name?: string })[];
  data?: ModelResponse[];
}

function extractModelNames(json: unknown): string[] {
  if (!json) return [];

  if (Array.isArray(json)) {
    return json
      .map((m: ModelResponse) => m.name || m.id || m.model || m.modelId)
      .filter(Boolean) as string[];
  }

  const response = json as OllamaResponse;

  if (response.models && Array.isArray(response.models)) {
    return response.models
      .map((m) => m.name || m.id || m.model || m.modelId)
      .filter(Boolean) as string[];
  }

  if (response.tags && Array.isArray(response.tags)) {
    return response.tags.map((t) => String(t)).filter(Boolean);
  }

  if (response.data && Array.isArray(response.data)) {
    return response.data
      .map((m) => m.id || m.name || m.model || m.modelId)
      .filter(Boolean) as string[];
  }

  return [];
}

async function checkLocalProvider(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/models`);

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          provider: 'local',
          message: 'Local AI service reachable but returned error',
        },
        { status: 503 }
      );
    }

    const json = await response.json().catch(() => null);
    const modelNames = extractModelNames(json);

    return NextResponse.json({
      status: 'ok',
      provider: 'local',
      message: 'Local AI is ready',
      models: modelNames,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        provider: 'local',
        message: `Failed to connect to local AI: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 503 }
    );
  }
}

function checkCloudProvider() {
  if (process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      status: 'ok',
      provider: 'cloud',
      message: 'Cloud AI configured',
    });
  }

  return NextResponse.json(
    {
      status: 'error',
      provider: 'cloud',
      message: 'Missing API Key',
    },
    { status: 503 }
  );
}

export function GET() {
  const provider = process.env.AI_PROVIDER || 'local';

  if (provider === 'local') {
    const baseUrl = process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1';
    return checkLocalProvider(baseUrl);
  }

  return checkCloudProvider();
}
