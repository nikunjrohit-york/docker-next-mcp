import { z } from 'zod';
import { tool } from 'ai';
import { gitTools } from './tools/git';

export const mcpTools = {
    get_recent_commits: tool({
        description: 'Get recent git commits from the current repository',
        parameters: z.object({
            limit: z.number().optional().default(10).describe('Number of commits to fetch'),
        }),
        execute: async ({ limit }) => {
            return await gitTools.get_recent_commits({ limit });
        },
    }),
    get_status: tool({
        description: 'Get the current git status (branch, modified files)',
        parameters: z.object({}),
        execute: async () => {
            return await gitTools.get_status();
        },
    }),
    get_file_content: tool({
        description: 'Read the content of a file from the repository',
        parameters: z.object({
            path: z.string().describe('Path to the file relative to repo root'),
        }),
        execute: async ({ path }) => {
            return await gitTools.get_file_content({ path });
        },
    }),
};
