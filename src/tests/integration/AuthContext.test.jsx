import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import React, { useState } from 'react';

const TestComponent = () => {
    const { user, register, login, logout, updateProfile } = useAuth();
    const [error, setError] = useState('');
    const [result, setResult] = useState('');

    const runAction = (action) => async () => {
        setError('');
        try {
            const response = await action();
            setResult(response ? JSON.stringify(response) : 'null');
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div>
            <div data-testid="user-display">{user ? (user.name || user.email) : 'No User'}</div>
            <div data-testid="error-display">{error}</div>
            <div data-testid="result-display">{result}</div>

            <button onClick={runAction(() => register('Jan', 'Kowalski', 'jan@example.com', 'secure-password-123'))}>
                Register
            </button>
            <button onClick={runAction(() => login('jan@example.com', 'secure-password-123'))}>
                Login
            </button>
            <button onClick={runAction(() => logout())}>Logout</button>
            <button onClick={runAction(() => updateProfile({ city: 'Warszawa' }))}>
                UpdateProfile
            </button>
        </div>
    );
};

describe('AuthContext Integration', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('restores valid session from API and updates user state', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'u1', email: 'restored@example.com', name: 'Restored User' })
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('Restored User');
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/me'),
            expect.objectContaining({ credentials: 'include' })
        );
        expect(localStorage.getItem('exotic_user')).toContain('restored@example.com');
    });

    it('registers user and persists session details', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({})
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ user: { id: 'u2', email: 'jan@example.com', name: 'Jan Kowalski' } })
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('No User');
        });

        fireEvent.click(screen.getByText('Register'));

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('Jan Kowalski');
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/register'),
            expect.objectContaining({
                method: 'POST',
                credentials: 'include'
            })
        );
        expect(localStorage.getItem('exotic_user')).toContain('jan@example.com');
        expect(localStorage.getItem('exotic_last_activity')).toBeTruthy();
    });

    it('returns readable register error when API returns non-json error body', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({})
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => {
                    throw new Error('broken json');
                },
                text: async () => 'Bad request'
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Register'));

        await waitFor(() => {
            expect(screen.getByTestId('error-display').textContent).toBe('Bad request');
        });
    });

    it('logs in user and updates context state', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({})
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ user: { id: 'u4', email: 'login@example.com', name: 'Login User' } })
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Login')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('Login User');
        });
    });

    it('updates profile only for authenticated user', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({})
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('UpdateProfile')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('UpdateProfile'));

        await waitFor(() => {
            expect(screen.getByTestId('result-display').textContent).toBe('null');
        });
    });

    it('updates profile and stores updated user when authenticated', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'u5', email: 'u5@example.com', name: 'U5 User' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'u5', email: 'u5@example.com', name: 'U5 User', city: 'Warszawa' })
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('U5 User');
        });

        fireEvent.click(screen.getByText('UpdateProfile'));

        await waitFor(() => {
            expect(screen.getByTestId('result-display').textContent).toContain('"city":"Warszawa"');
        });
        expect(localStorage.getItem('exotic_user')).toContain('"city":"Warszawa"');
    });

    it('logs out automatically when inactivity timeout is exceeded', async () => {
        const oldTimestamp = (Date.now() - (21 * 60 * 1000)).toString();
        localStorage.setItem('exotic_last_activity', oldTimestamp);

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'u6', email: 'u6@example.com', name: 'Inactive User' })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ message: 'Logged out successfully' })
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/logout'),
                expect.objectContaining({ method: 'POST', credentials: 'include' })
            );
        });

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('No User');
        });
    });

    it('updates last activity timestamp on window interaction for authenticated user', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'u7', email: 'u7@example.com', name: 'Active User' })
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('Active User');
        });

        const before = Number(localStorage.getItem('exotic_last_activity') || 0);
        fireEvent.mouseDown(window);

        await waitFor(() => {
            const after = Number(localStorage.getItem('exotic_last_activity') || 0);
            expect(after).toBeGreaterThanOrEqual(before);
            expect(after).toBeGreaterThan(0);
        });
    });

    it('handles restoreSession fetch failure by clearing persisted session cache', async () => {
        localStorage.setItem('exotic_user', JSON.stringify({ id: 'cached', email: 'cached@example.com' }));
        globalThis.fetch.mockRejectedValueOnce(new Error('network down'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('cached@example.com');
        });
        expect(localStorage.getItem('exotic_user')).toBeNull();
    });

    it('surfaces login error from API response', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({})
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Invalid credentials' })
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Login')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Login'));

        await waitFor(() => {
            expect(screen.getByTestId('error-display').textContent).toBe('Invalid credentials');
        });
    });

    it('surfaces readable error when updateProfile request fails for authenticated user', async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'u8', email: 'u8@example.com', name: 'U8 User' })
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({})
            });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-display').textContent).toBe('U8 User');
        });

        fireEvent.click(screen.getByText('UpdateProfile'));

        await waitFor(() => {
            expect(screen.getByTestId('error-display').textContent).toBe('Nie udało się zapisać ustawień');
        });
    });
});
