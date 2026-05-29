import { z } from 'zod';

export const ConsentSchema = z.object({
    consentType: z.string().min(1).max(100),
    status: z.boolean()
});

export const ConsentBatchSchema = z.record(z.string().min(1).max(100), z.boolean());

