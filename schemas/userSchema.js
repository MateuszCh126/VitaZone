import { z } from 'zod';

/**
 * User Schemas
 * 
 * Zod schemas for validating user-related API payloads.
 * These ensure data integrity before it reaches the repository.
 */

/**
 * Schema for user registration.
 * Frontend sends plain password; backend hashes it.
 */
export const RegisterSchema = z.object({
    firstName: z.string()
        .min(2, 'Imię musi mieć co najmniej 2 znaki')
        .max(100, 'Imię nie może być dłuższe niż 100 znaków')
        .transform(val => val.trim()),
    lastName: z.string()
        .min(2, 'Nazwisko musi mieć co najmniej 2 znaki')
        .max(100, 'Nazwisko nie może być dłuższe niż 100 znaków')
        .transform(val => val.trim()),
    email: z.string()
        .email('Nieprawidłowy format adresu e-mail')
        .transform(val => val.toLowerCase().trim()),
    password: z.string()
        .min(8, 'Hasło musi mieć co najmniej 8 znaków')
        .max(128, 'Hasło nie może być dłuższe niż 128 znaków'),
    country: z.string().min(2).max(100).optional(),
    city: z.string().min(2).max(100).optional(),
    postal_code: z.string().min(3).max(20).optional(),
    street: z.string().min(2).max(255).optional(),
    house_number: z.string().min(1).max(20).optional(),
    apartment_number: z.string().max(20).optional()
});

/**
 * Schema for user login.
 */
export const LoginSchema = z.object({
    email: z.string()
        .email('Nieprawidłowy format adresu e-mail')
        .transform(val => val.toLowerCase().trim()),
    password: z.string()
        .min(1, 'Hasło jest wymagane')
});

/**
 * Schema for profile updates.
 * All fields are optional.
 */
export const ProfileUpdateSchema = z.object({
    firstName: z.string().min(2).max(100).transform(val => val.trim()).optional(),
    lastName: z.string().min(2).max(100).transform(val => val.trim()).optional(),
    name: z.string().min(2).max(200).transform(val => val.trim()).optional(),
    country: z.string().min(2).max(100).optional(),
    city: z.string().min(2).max(100).optional(),
    postal_code: z.string().min(3).max(20).optional(),
    street: z.string().min(2).max(255).optional(),
    house_number: z.string().min(1).max(20).optional(),
    apartment_number: z.string().max(20).optional(),
    phone: z.string().min(6).max(30).optional()
});
