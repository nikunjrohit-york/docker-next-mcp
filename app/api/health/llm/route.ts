import { NextResponse } from 'next/server';

export async function GET() {
    const provider = process.env.AI_PROVIDER || 'local';

    try {
        if (provider === 'local') {
            const baseUrl = process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1';
            // Try to fetch models from Ollama/Local provider
            // Note: Ollama's OpenAI compatible endpoint for models is /v1/models
            const response = await fetch(`${baseUrl}/models`);

            if (response.ok) {
                const json = await response.json().catch(() => null);
                let modelNames: string[] = [];
                if (Array.isArray(json)) {
                    modelNames = json.map((m: any) => m.name || m.id || m.model || m.modelId).filter(Boolean);
                } else if (json && Array.isArray(json.models)) {
                    modelNames = json.models.map((m: any) => m.name || m.id || m.model || m.modelId).filter(Boolean);
                } else if (json && Array.isArray(json.tags)) {
                    modelNames = json.tags.map((t: any) => String(t)).filter(Boolean);
                } else if (json && Array.isArray(json.data)) {
                    modelNames = json.data.map((m: any) => m.id || m.name || m.model || m.modelId).filter(Boolean);
                }
                return NextResponse.json({ status: 'ok', provider: 'local', message: 'Local AI is ready', models: modelNames });
            } else {
                return NextResponse.json({ status: 'error', provider: 'local', message: 'Local AI service reachable but returned error' }, { status: 503 });
            }
        } else {
            // Cloud provider check
            if (process.env.OPENAI_API_KEY) {
                return NextResponse.json({ status: 'ok', provider: 'cloud', message: 'Cloud AI configured' });
            } else {
                return NextResponse.json({ status: 'error', provider: 'cloud', message: 'Missing API Key' }, { status: 503 });
            }
        }
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            provider,
            message: `Failed to connect to AI provider: ${error instanceof Error ? error.message : String(error)}`
        }, { status: 503 });
    }
}
