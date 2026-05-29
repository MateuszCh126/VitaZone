/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/config';
import { trackEvent } from '../utils/analytics';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const API_URL = `${API_BASE}/api`;
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
    const extractApiError = async (response, fallbackMessage) => {
        try {
            const data = await response.json();
            if (data?.error) return data.error;
        } catch {
            // ignore parse error
        }
        return fallbackMessage;
    };

    const prevUserIdRef = useRef(user?.id || null);
    const prevDiscountStateRef = useRef({
        code: null,
        cartLength: 0,
        cartTotal: 0
    });

    const validateDiscountCode = useCallback(async (code, totalCents) => {
        const res = await fetch(`${API_URL}/discounts/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, cartTotal: totalCents })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Nieprawidłowy kod rabatowy');
        }

        return data;
    }, [API_URL]);

    // Initial Cart Load & Sync Logic
    useEffect(() => {
        const initializeCart = async () => {
            const previousUserId = prevUserIdRef.current;
            const nextUserId = user?.id || null;
            const didUserChange = previousUserId !== nextUserId;

            if (didUserChange) {
                setAppliedDiscount(null);
            }

            // 1. Detect Logout (User transitioned from logged-in to null)
            if (previousUserId && !nextUserId) {
                setCart([]);
                localStorage.removeItem('exotic_cart');
                prevUserIdRef.current = nextUserId;
                return;
            }

            // 2. Logged In User
            if (user) {
                if (didUserChange) {
                    setCart([]);
                }
                setIsLoading(true);
                try {
                    // Check for local guest cart to merge
                    const localCart = JSON.parse(localStorage.getItem('exotic_cart') || '[]');

                    if (localCart.length > 0) {
                        // Sync local items to server
                        const response = await fetch(`${API_URL}/cart/sync`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                items: localCart.map(item => ({
                                    productId: item.id || item.productId,
                                    quantity: item.quantity
                                }))
                            })
                        });
                        if (!response.ok) {
                            throw new Error(await extractApiError(response, 'Nie udało się zsynchronizować koszyka.'));
                        }
                        const data = await response.json();
                        if (data.items) {
                            setCart(data.items);
                            localStorage.removeItem('exotic_cart'); // Clear after sync
                        }
                    } else {
                        // Fetch server cart
                        const response = await fetch(`${API_URL}/cart`, {
                            credentials: 'include'
                        });
                        if (!response.ok) {
                            throw new Error(await extractApiError(response, 'Nie udało się pobrać koszyka.'));
                        }
                        const data = await response.json();
                        if (data.items) setCart(data.items);
                    }
                } catch (error) {
                    console.error('Failed to load user cart', error);
                } finally {
                    setIsLoading(false);
                }
            }
            // 3. Guest User (Initial Load)
            else {
                const savedCart = localStorage.getItem('exotic_cart');
                if (savedCart) {
                    try {
                        setCart(JSON.parse(savedCart));
                    } catch (e) {
                        console.error('Cart parse error', e);
                        setCart([]);
                    }
                }
            }

            // Update ref for next run
            prevUserIdRef.current = nextUserId;
        };

        initializeCart();
    }, [user, API_URL]);

    // Save Guest Cart to LocalStorage
    useEffect(() => {
        if (!user) {
            localStorage.setItem('exotic_cart', JSON.stringify(cart));
        }
    }, [cart, user]);

    useEffect(() => {
        if (!appliedDiscount?.code) {
            prevDiscountStateRef.current = {
                code: null,
                cartLength: cart.length,
                cartTotal
            };
            return;
        }

        if (cart.length === 0 || cartTotal <= 0) {
            setAppliedDiscount(null);
            prevDiscountStateRef.current = {
                code: null,
                cartLength: cart.length,
                cartTotal
            };
            return;
        }

        const previousState = prevDiscountStateRef.current;
        const shouldRevalidate =
            previousState.code === appliedDiscount.code &&
            (previousState.cartLength !== cart.length || previousState.cartTotal !== cartTotal);

        prevDiscountStateRef.current = {
            code: appliedDiscount.code,
            cartLength: cart.length,
            cartTotal
        };

        if (!shouldRevalidate) return;

        let isActive = true;

        const revalidateDiscount = async () => {
            try {
                const discount = await validateDiscountCode(
                    appliedDiscount.code,
                    Math.round(cartTotal * 100)
                );

                if (!isActive) return;

                setAppliedDiscount((current) => {
                    if (!current || current.code !== appliedDiscount.code) {
                        return current;
                    }

                    if (current.amount === discount.amount) {
                        return current;
                    }

                    return discount;
                });
            } catch {
                if (isActive) {
                    setAppliedDiscount(null);
                }
            }
        };

        revalidateDiscount();

        return () => {
            isActive = false;
        };
    }, [appliedDiscount?.code, cart.length, cartTotal, validateDiscountCode]);

    const addToCart = async (product) => {
        // Optimistic Update
        const previousCart = [...cart];

        setCart(currentCart => {
            const existingItem = currentCart.find(item => (item.id === product.id || item.productId === product.id));
            // Normalize ID: product.id is usually the source of truth from UI
            const productId = product.id || product.productId;

            if (existingItem) {
                return currentCart.map(item =>
                    (item.id === productId || item.productId === productId) ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentCart, { ...product, id: productId, productId: productId, quantity: 1 }];
        });
        setIsCartOpen(true);
        trackEvent('add_to_cart', {
            productId: product.id || product.productId,
            name: product.name,
            category: product.category_name || null,
            price: Number(product.price) || 0
        });

        if (user) {
            try {
                const res = await fetch(`${API_URL}/cart/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        productId: product.id || product.productId,
                        quantity: 1
                    })
                });
                if (!res.ok) {
                    throw new Error(await extractApiError(res, 'Nie udało się dodać produktu do koszyka.'));
                }
            } catch (error) {
                console.error('Add to cart failed', error);
                setCart(previousCart); // Rollback
            }
        }
    };

    const removeFromCart = async (id) => {
        const removedItem = cart.find(item => item.id === id || item.productId === id);
        const previousCart = [...cart];
        setCart(currentCart => currentCart.filter(item => (item.id !== id && item.productId !== id)));
        if (removedItem) {
            trackEvent('remove_from_cart', {
                productId: removedItem.id || removedItem.productId,
                name: removedItem.name,
                category: removedItem.category_name || null,
                price: Number(removedItem.price) || 0
            });
        }

        if (user) {
            try {
                const res = await fetch(`${API_URL}/cart/items/${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!res.ok) {
                    throw new Error(await extractApiError(res, 'Nie udało się usunąć produktu z koszyka.'));
                }
            } catch (error) {
                console.error('Remove from cart failed', error);
                setCart(previousCart);
            }
        }
    };

    const updateQuantity = async (id, amount) => {
        // This logic is tricky with optimistic updates if backend calculates total
        // But for simple quantity update:
        const previousCart = [...cart];
        let newQuantity = 0;

        setCart(currentCart => currentCart.map(item => {
            if (item.id === id || item.productId === id) {
                newQuantity = Math.max(1, item.quantity + amount); // Frontend doesn't support 0 here usually, distinct delete action needed
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));

        if (user) {
            try {
                // If amount resulted in change, sync it
                // We need to fetch the item to know current quantity if we don't trust state? 
                // We trust state for optimistic.
                const targetItem = cart.find(item => item.id === id || item.productId === id);
                if (targetItem) {
                    const finalQty = Math.max(1, targetItem.quantity + amount);
                    const res = await fetch(`${API_URL}/cart/items/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ quantity: finalQty })
                    });
                    if (!res.ok) {
                        throw new Error(await extractApiError(res, 'Nie udało się zaktualizować ilości produktu.'));
                    }
                }
            } catch (error) {
                console.error('Update quantity failed', error);
                setCart(previousCart);
            }
        }
    };

    const clearCart = async () => {
        setCart([]);
        setAppliedDiscount(null);
        if (!user) {
            localStorage.removeItem('exotic_cart');
        } else {
            try {
                const res = await fetch(`${API_URL}/cart`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                if (!res.ok) {
                    throw new Error(await extractApiError(res, 'Nie udało się wyczyścić koszyka.'));
                }
            } catch (error) {
                console.error('Failed to clear server cart', error);
            }
        }
    };

    const applyDiscount = async (code) => {
        try {
            const discount = await validateDiscountCode(code, Math.round(cartTotal * 100));
            setAppliedDiscount(discount);
            return { success: true, discount };
        } catch (error) {
            setAppliedDiscount(null);
            return { success: false, error: error.message };
        }
    };

    const removeDiscount = () => setAppliedDiscount(null);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            appliedDiscount,
            applyDiscount,
            removeDiscount,
            isCartOpen,
            setIsCartOpen,
            isLoading
        }}>
            {children}
        </CartContext.Provider>
    );
};
