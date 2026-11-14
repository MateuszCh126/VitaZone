import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
    firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
    confirmPassword: z.string(),
    ageVerified: z.literal(true, {
        errorMap: () => ({ message: "Wymagane potwierdzenie pełnoletności (18+)" }),
    }),
    termsAccepted: z.literal(true, {
        errorMap: () => ({ message: "Wymagana akceptacja Regulaminu" }),
    }),
    newsletter: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
});

const Register = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data) => {
        setServerError('');
        setIsLoading(true);
        // const fullName = `${data.firstName} ${data.lastName}`; // No longer needed
        try {
            await registerUser(data.firstName, data.lastName, data.email, data.password, {
                ageVerified: data.ageVerified,
                termsAccepted: data.termsAccepted,
                newsletter: data.newsletter
            });
            const returnTo = location.state?.from;
            navigate(typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard');
        } catch (err) {
            setServerError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-20">
            <Helmet>
                <title>Utwórz konto | VitaZone</title>
                <meta name="robots" content="noindex,follow" />
            </Helmet>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-bg-secondary p-8 md:p-12 w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Utwórz konto</h1>
                    <p className="text-gray-400">Konto pozwala sprawdzać historię swoich zamówień.</p>
                </div>

                {serverError && (
                    <div role="alert" className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm">
                        <AlertCircle size={16} /> {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="register-first-name" className="text-xs font-medium text-gray-400 ml-1 uppercase">Imię</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    {...register('firstName')}
                                    id="register-first-name"
                                    type="text"
                                    autoComplete="given-name"
                                    aria-invalid={Boolean(errors.firstName)}
                                    aria-describedby={errors.firstName ? 'register-first-name-error' : undefined}
                                    className={`w-full bg-black/50 border ${errors.firstName ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all`}
                                    placeholder="Jan"
                                />
                            </div>
                            {errors.firstName && <p id="register-first-name-error" role="alert" className="text-red-400 text-xs mt-1 ml-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                        <label htmlFor="register-last-name" className="text-xs font-medium text-gray-400 ml-1 uppercase">Nazwisko</label>
                            <div className="relative">
                                <input
                                    {...register('lastName')}
                                    id="register-last-name"
                                    type="text"
                                    autoComplete="family-name"
                                    aria-invalid={Boolean(errors.lastName)}
                                    aria-describedby={errors.lastName ? 'register-last-name-error' : undefined}
                                    className={`w-full bg-black/50 border ${errors.lastName ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all`}
                                    placeholder="Kowalski"
                                />
                            </div>
                            {errors.lastName && <p id="register-last-name-error" role="alert" className="text-red-400 text-xs mt-1 ml-1">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="register-email" className="text-xs font-medium text-gray-400 ml-1 uppercase">Adres email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                {...register('email')}
                                id="register-email"
                                type="email"
                                autoComplete="email"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'register-email-error' : undefined}
                                className={`w-full bg-black/50 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all`}
                                placeholder="jan.kowalski@example.com"
                            />
                        </div>
                        {errors.email && <p id="register-email-error" role="alert" className="text-red-400 text-xs mt-1 ml-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="register-password" className="text-xs font-medium text-gray-400 ml-1 uppercase">Hasło</label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                {...register('password')}
                                id="register-password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? 'register-password-error' : undefined}
                                className={`w-full bg-black/50 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all`}
                                placeholder="Min. 6 znaków"
                            />
                        </div>
                        {errors.password && <p id="register-password-error" role="alert" className="text-red-400 text-xs mt-1 ml-1">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="register-confirm-password" className="text-xs font-medium text-gray-400 ml-1 uppercase">Potwierdź hasło</label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                {...register('confirmPassword')}
                                id="register-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.confirmPassword)}
                                aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                                className={`w-full bg-black/50 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all`}
                                placeholder="Powtórz hasło"
                            />
                        </div>
                        {errors.confirmPassword && <p id="register-confirm-password-error" role="alert" className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-start gap-3">
                            <input
                                {...register('ageVerified')}
                                type="checkbox"
                                id="ageVerified"
                                aria-invalid={Boolean(errors.ageVerified)}
                                aria-describedby={errors.ageVerified ? 'register-age-error' : undefined}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary"
                            />
                            <label htmlFor="ageVerified" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
                                <span className="font-bold text-white">[Wymagane]</span> Oświadczam, że mam ukończone 18 lat.
                            </label>
                        </div>
                        {errors.ageVerified && <p id="register-age-error" role="alert" className="text-red-400 text-xs ml-1">{errors.ageVerified.message}</p>}

                        <div className="flex items-start gap-3">
                            <input
                                {...register('termsAccepted')}
                                type="checkbox"
                                id="termsAccepted"
                                aria-invalid={Boolean(errors.termsAccepted)}
                                aria-describedby={errors.termsAccepted ? 'register-terms-error' : undefined}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary"
                            />
                            <label htmlFor="termsAccepted" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
                                <span className="font-bold text-white">[Wymagane]</span> Akceptuję <Link to="/terms" className="text-primary hover:underline">Regulamin</Link> i <Link to="/privacy" className="text-primary hover:underline">Politykę Prywatności</Link>.
                            </label>
                        </div>
                        {errors.termsAccepted && <p id="register-terms-error" role="alert" className="text-red-400 text-xs ml-1">{errors.termsAccepted.message}</p>}

                        <div className="flex items-start gap-3">
                            <input
                                {...register('newsletter')}
                                type="checkbox"
                                id="newsletter"
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-primary focus:ring-primary"
                            />
                            <label htmlFor="newsletter" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
                                [Opcjonalne] Wyrażam zgodę na otrzymywanie informacji handlowych (Newsletter).
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-black font-bold py-4 rounded-xl hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                    >
                        {isLoading ? 'Tworzenie konta...' : (
                            <>Zarejestruj się <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    Masz już konto? <Link to="/login" state={{ from: location.state?.from }} className="text-primary cursor-pointer hover:underline">Zaloguj się</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
