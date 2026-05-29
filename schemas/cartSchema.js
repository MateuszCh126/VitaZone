import { z } from 'zod';

export const CartItemSchema = z.object({
    productId: z.string().uuid('Nieprawidłowy identyfikator produktu'),
    quantity: z.number().int().min(1, 'Minimalna ilość to 1').max(99, 'Maksymalna ilość to 99')
});

export const SyncCartSchema = z.object({
    items: z.array(CartItemSchema).max(100, 'Koszyk może zawierać maksymalnie 100 pozycji')
});

export const UpdateCartItemSchema = z.object({
    quantity: z.number().int().min(1, 'Minimalna ilość to 1').max(99, 'Maksymalna ilość to 99')
});

export const CartItemParamSchema = z.object({
    productId: z.string().uuid('Nieprawidłowy identyfikator produktu')
});
