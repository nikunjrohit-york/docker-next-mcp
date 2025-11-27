'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    const settings = await prisma.systemSettings.findMany();
    return settings.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
}

export async function updateSettings(formData: FormData) {
    const provider = formData.get('provider') as string;
    const openaiKey = formData.get('openaiKey') as string;
    const ollamaUrl = formData.get('ollamaUrl') as string;

    await prisma.systemSettings.upsert({
        where: { key: 'AI_PROVIDER' },
        update: { value: provider },
        create: { key: 'AI_PROVIDER', value: provider },
    });

    if (openaiKey) {
        await prisma.systemSettings.upsert({
            where: { key: 'OPENAI_API_KEY' },
            update: { value: openaiKey },
            create: { key: 'OPENAI_API_KEY', value: openaiKey },
        });
    }

    if (ollamaUrl) {
        await prisma.systemSettings.upsert({
            where: { key: 'OPENAI_BASE_URL' },
            update: { value: ollamaUrl },
            create: { key: 'OPENAI_BASE_URL', value: ollamaUrl },
        });
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}
