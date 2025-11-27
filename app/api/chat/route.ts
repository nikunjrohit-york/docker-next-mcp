import { streamText, generateText } from 'ai';
import { getModel, getModelInfo } from '@/lib/ai/model-provider';
import { mcpTools } from '@/lib/mcp';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const url = new URL(req.url);
    const streamParam = url.searchParams.get('stream');
    const acceptHeader = req.headers.get('accept') || '';
    // If the Accept header prefers JSON, or explicit ?stream=false, return JSON
    const acceptRequestsJson = acceptHeader.includes('application/json');
    const useStream = !(acceptRequestsJson || (streamParam && streamParam.toLowerCase() === 'false'));

    // Quick diagnostics command: POST with message content '/model' to get back provider & model info
    if (messages?.length === 1 && typeof messages[0].content === 'string' && messages[0].content.trim().toLowerCase() === '/model') {
        const info = await getModelInfo();
        return new Response(JSON.stringify({ status: 'ok', model: info }), { headers: { 'Content-Type': 'application/json' } });
    }

    const allowTools = (process.env.ALLOW_MCP_TOOLS === 'true');
    if (!useStream) {
        const generateOptions: any = {
            model: await getModel(),
            messages,
            maxSteps: 5,
            system: `You are InsightOne, an intelligent project assistant.
    You help developers understand their codebase and answer questions.
    ${allowTools ? 'You have access to Git tools to analyze the repository.' : ''}
    Always be concise and helpful.`,
        };
        if (allowTools) generateOptions.tools = mcpTools;

        const generateResult = await generateText(generateOptions);

        // Return a concise JSON payload for non-streaming clients
        const responsePayload = {
            status: 'ok',
            text: generateResult.text ?? null,
            toolCalls: generateResult.toolCalls ?? [],
            toolResults: generateResult.toolResults ?? [],
            finishReason: generateResult.finishReason ?? null,
            response: generateResult.response ?? {},
            usage: generateResult.usage ?? {},
        };

        return new Response(JSON.stringify(responsePayload), { headers: { 'Content-Type': 'application/json' } });
    }

    const streamOptions: any = {
        model: await getModel(),
        messages,
        maxSteps: 5, // Allow up to 5 tool calls in a single request
        system: `You are InsightOne, an intelligent project assistant.
    You help developers understand their codebase and answer questions.
    ${allowTools ? 'You have access to Git tools to analyze the repository.' : ''}
    Always be concise and helpful.`,
    };
    if (allowTools) streamOptions.tools = mcpTools;

    const result = await streamText(streamOptions);

    return result.toDataStreamResponse();
}
