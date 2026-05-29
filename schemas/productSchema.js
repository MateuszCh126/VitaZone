import { z } from 'zod';

export const ProductSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    species: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    stock: z.number().int().nonnegative("Stock cannot be negative"),
    categoryId: z.string().uuid("Invalid Category ID"),
    imageUrls: z.array(z.string()).optional(),
    specs: z.record(z.string(), z.any()).optional(),
    is_active: z.boolean().optional()
});

export const ProductUpdateSchema = ProductSchema.partial();

export const ToggleActiveSchema = z.object({
    isActive: z.boolean()
});
