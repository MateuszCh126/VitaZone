import { z } from 'zod';
import { TerrariumDesignerProductSchema } from '../shared/terrarium.js';

const ProductFieldsSchema = z.object({
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

const validateTerrariumSpecs = (data, context) => {
    const designerConfig = data.specs?.terrariumDesigner;
    if (designerConfig === undefined) return;

    const parsed = TerrariumDesignerProductSchema.safeParse(designerConfig);
    if (!parsed.success) {
        for (const issue of parsed.error.issues) {
            context.addIssue({
                code: 'custom',
                path: ['specs', 'terrariumDesigner', ...issue.path],
                message: issue.message
            });
        }
    }
};

export const ProductSchema = ProductFieldsSchema.superRefine(validateTerrariumSpecs);

export const ProductUpdateSchema = ProductFieldsSchema.partial().superRefine(validateTerrariumSpecs);

export const ToggleActiveSchema = z.object({
    isActive: z.boolean()
});
