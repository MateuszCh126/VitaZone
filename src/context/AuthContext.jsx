/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../utils/config';

const AuthContext = createContext();

const readStoredUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const savedUser = window.localStorage.getItem('exotic_user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch {
        window.localStorage.removeItem('exotic_user');
        window.localStorage.removeItem('exotic_last_activity');
        return null;
    }
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => readStoredUser());
    const [loading, setLoading] = useState(true);

    // --- Session Restoration ---
    useEffect(() => {
        const restoreSession = async () => {
            try {
                // Verify session with API (cookies are sent automatically)
                const apiBase = API_BASE;
                // 'credentials: include' is CRITICAL for sending cookies
                const res = await fetch(`${apiBase}/api/auth/me`, {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (res.ok) {
                    const dbUser = await res.json();
                    setUser(dbUser);
                    localStorage.setItem('exotic_user', JSON.stringify(dbUser));
                    if (!localStorage.getItem('exotic_last_activity')) {
                        localStorage.setItem('exotic_last_activity', Date.now().toString());
                    }
                } else {
                    // Session invalid
                    setUser(null);
                    localStorage.removeItem('exotic_user');
                    localStorage.removeItem('exotic_last_activity');
                }
            } catch {
                localStorage.removeItem('exotic_user');
                localStorage.removeItem('exotic_last_activity');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    /**
     * Register new user.
     */
    const register = async (firstName, lastName, email, password, consents = {}) => {
        const apiBase = API_BASE;
        const res = await fetch(`${apiBase}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ firstName, lastName, email, password, consents })
        });

        if (!res.ok) {
            let errorMsg = 'Registration failed';
            try {
                const errorData = await res.json();
                errorMsg = errorData.error || errorMsg;
            } catch {
                // If JSON fails, try text or use status
                const text = await res.text().catch(() => '');
                errorMsg = text || `HTTP Error ${res.status}`;
            }
            throw new Error(errorMsg);
        }

        const data = await res.json();
        setUser(data.user);
        // Token is handled via Cookie automatically
        localStorage.setItem('exotic_user', JSON.stringify(data.user));
        localStorage.setItem('exotic_last_activity', Date.now().toString());

        return data.user;
    };

    /**
     * Login user.
     */
    const login = async (email, password) => {
        const apiBase = API_BASE;
        const res = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Send/Receive Cookies
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            let errorMsg = 'Login failed';
            try {
                const errorData = await res.json();
                errorMsg = errorData.error || errorMsg;
            } catch {
                const text = await res.text().catch(() => '');
                errorMsg = text || `HTTP Error ${res.status}`;
            }
            throw new Error(errorMsg);
        }

        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('exotic_user', JSON.stringify(data.user));
        localStorage.setItem('exotic_last_activity', Date.now().toString());
        return data.user;
    };

    /**
     * Logout user.
     */
    const logout = async () => {
        const apiBase = API_BASE;
        try {
            await fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch { /* ignore */ }

        setUser(null);
        localStorage.removeItem('exotic_user');
        localStorage.removeItem('exotic_last_activity');
    };

    // --- Session Timeout (20 min inactivity) ---
    useEffect(() => {
        if (!user) return;

        const TIMEOUT_MS = 20 * 60 * 1000;

        const checkForInactivity = () => {
            const lastActivity = localStorage.getItem('exotic_last_activity');
            if (lastActivity && (Date.now() - Number(lastActivity) > TIMEOUT_MS)) {
                // Session expired due to inactivity
                logout();
            }
        };

        const updateActivity = () => {
            localStorage.setItem('exotic_last_activity', Date.now().toString());
        };

        checkForInactivity();

        const passiveOptions = { passive: true };
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach((event) =>
            window.addEventListener(
                event,
                updateActivity,
                event === 'scroll' || event === 'touchstart' ? passiveOptions : undefined
            )
        );

        const interval = setInterval(checkForInactivity, 60000);

        return () => {
            events.forEach((event) =>
                window.removeEventListener(
                    event,
                    updateActivity,
                    event === 'scroll' || event === 'touchstart' ? passiveOptions : undefined
                )
            );
            clearInterval(interval);
        };
    }, [user]);

    /**
     * Update user profile.
     */
    const updateProfile = async (data) => {
        if (!user) return null;

        const payload = {
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
            country: data.country,
            city: data.city,
            postal_code: data.postal_code || data.postalCode,
            street: data.street,
            house_number: data.house_number || data.houseNumber,
            apartment_number: data.apartment_number || data.apartmentNumber,
            phone: data.phone
        };

        const apiBase = API_BASE;
        const res = await fetch(`${apiBase}/api/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const updated = await res.json();
            setUser(updated);
            localStorage.setItem('exotic_user', JSON.stringify(updated));
            return updated;
        }

        let errorMsg = 'Nie udało się zapisać ustawień';
        try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorMsg;
        } catch {
            // keep fallback
        }
        throw new Error(errorMsg);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
