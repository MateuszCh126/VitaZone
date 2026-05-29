import { z } from 'zod';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(2000)
});

export const ChatRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1).max(30)
});

