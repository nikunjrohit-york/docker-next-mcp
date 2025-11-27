import { prisma } from '@/lib/db';
import crypto from 'crypto';

export function computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

export async function getCachedSummary(hash: string): Promise<string | null> {
    try {
        const cached = await prisma.analysisCache.findUnique({
            where: { hash },
        });
        return cached?.summary || null;
    } catch (e) {
        console.error('Cache read error:', e);
        return null;
    }
}

export async function setCachedSummary(hash: string, summary: string): Promise<void> {
    try {
        await prisma.analysisCache.upsert({
            where: { hash },
            update: { summary },
            create: { hash, summary },
        });
    } catch (e) {
        console.error('Cache write error:', e);
    }
}
