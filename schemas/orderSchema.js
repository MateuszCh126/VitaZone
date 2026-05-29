import { z } from 'zod';
import { ORDER_STATUS_VALUES } from '../shared/orderStatus.js';

/**
 * Order Schemas
 * 
 * Zod schemas for validating order-related API payloads.
 */

const OrderItemSchema = z.object({
    productId: z.string().uuid('Invalid product ID'),
    name: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().int().positive()
});

const ShippingSchema = z.object({
    country: z.string().min(2, 'Country is required'),
    city: z.string().min(2, 'City is required'),
    postal_code: z.string().min(3, 'Postal code is required'),
    street: z.string().min(2, 'Street is required'),
    house_number: z.string().min(1, 'House number is required'),
    apartment_number: z.string().optional()
});

/**
 * Schema for creating a new order.
 */
export const CreateOrderSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
    total: z.number().positive('Total must be positive'),
    shipping: ShippingSchema,
    discountCode: z.string().min(3).max(50).optional().nullable()
});

export const UpdateOrderStatusSchema = z.object({
    status: z.enum(ORDER_STATUS_VALUES)
});
