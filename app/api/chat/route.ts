import { generateText, streamText } from 'ai';
import { getModel, getModelInfo } from '@/lib/ai/model-provider';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { mcpTools } from '@/lib/mcp';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const url = new URL(req.url);
  const streamParam = url.searchParams.get('stream');
  const acceptHeader = req.headers.get('accept') || '';

  // Determine if we should stream based on headers or query param
  const acceptRequestsJson = acceptHeader.includes('application/json');
  const useStream = !(acceptRequestsJson || (streamParam && streamParam.toLowerCase() === 'false'));

  // Quick diagnostics command
  if (
    messages?.length === 1 &&
    typeof messages[0].content === 'string' &&
    messages[0].content.trim().toLowerCase() === '/model'
  ) {
    const info = await getModelInfo();
    return Response.json({ status: 'ok', model: info });
  }

  const allowTools = process.env.ALLOW_MCP_TOOLS === 'true';
  const toolsInstruction = allowTools
    ? 'You have access to Git tools to analyze the repository.'
    : '';
  const system = SYSTEM_PROMPT.replace('{{TOOLS_INSTRUCTION}}', toolsInstruction);

  const model = await getModel();
  const commonOptions = {
    model,
    messages,
    maxSteps: 5,
    system,
    tools: allowTools ? mcpTools : undefined,
  };

  if (!useStream) {
    const generateResult = await generateText(commonOptions);

    return Response.json({
      status: 'ok',
      text: generateResult.text ?? null,
      toolCalls: generateResult.toolCalls ?? [],
      toolResults: generateResult.toolResults ?? [],
      finishReason: generateResult.finishReason ?? null,
      response: generateResult.response ?? {},
      usage: generateResult.usage ?? {},
    });
  }

  const result = await streamText(commonOptions);
  return result.toDataStreamResponse();
}
