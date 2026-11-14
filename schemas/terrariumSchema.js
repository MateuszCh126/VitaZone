import { z } from 'zod';
import { TerrariumConfigurationSchema } from '../shared/terrarium.js';

export const CreateTerrariumProjectSchema = TerrariumConfigurationSchema;

export const AdminTerrariumQuoteSchema = z.object({
  items: z.array(z.object({
    productId: z.uuid(),
    unitPriceCents: z.number().int().positive().max(100_000_000)
  }).strict()).min(1).max(81),
  validForDays: z.number().int().min(1).max(30).default(7),
  message: z.string().trim().max(1000).default('')
}).strict();

export const TerrariumCheckoutSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().max(255),
  country: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  postal_code: z.string().trim().min(2).max(20),
  street: z.string().trim().min(2).max(120),
  house_number: z.string().trim().min(1).max(20),
  apartment_number: z.string().trim().max(20).nullable().optional()
}).strict();
