import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { API_BASE } from '../utils/config';

const createMessage = (role, content) => ({
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
});

const ChatWidget = () => {
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnreadResponse, setHasUnreadResponse] = useState(false);
    const isOpenRef = useRef(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    const setPanelOpen = (open) => {
        isOpenRef.current = open;
        setIsOpen(open);
        if (open) setHasUnreadResponse(false);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }, [messages, isOpen, prefersReducedMotion]);

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const nextMessages = [...messages, createMessage('user', trimmedInput)];
        setMessages(nextMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    messages: nextMessages.map(({ role, content }) => ({ role, content }))
                })
            });

            const rawBody = await response.text();
            let data = {};

            if (rawBody) {
                try {
                    data = JSON.parse(rawBody);
                } catch {
                    data = {};
                }
            }

            if (!response.ok) {
                throw new Error(data.error || 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.');
            }

            if (typeof data.message !== 'string' || !data.message.trim()) {
                throw new Error('Asystent nie zwrócił odpowiedzi. Spróbuj ponownie za chwilę.');
            }

            setMessages((current) => [...current, createMessage('assistant', data.message.trim())]);
            if (!isOpenRef.current) setHasUnreadResponse(true);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((current) => [
                ...current,
                createMessage(
                    'assistant',
                    error.message || 'Twój asystent jest obecnie niedostępny. Spróbuj ponownie za chwilę.'
                )
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-4 left-4 right-4 z-40 flex flex-col items-stretch gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end sm:gap-4 ${pathname === '/register' ? 'max-sm:hidden' : ''}`}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                        role="region"
                        aria-labelledby="chat-title"
                        className="glass flex h-[min(70vh,32rem)] max-h-[calc(100svh-5.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:h-[500px] sm:w-[400px]"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 bg-primary/5 p-3 sm:p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 id="chat-title" className="font-bold text-white">Asystent terrarystyki</h3>
                                    <p className="text-xs text-neutral-300">Informacje o ofercie sklepu</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPanelOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                aria-label="Zamknij okno czatu"
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4" aria-live="polite" aria-relevant="additions text">
                            {messages.length === 0 && (
                                <div className="mt-6 p-4 text-center text-gray-400 sm:mt-10">
                                    <Bot size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">Zapytaj o informacje podane w opisach produktów i wyposażenia.</p>
                                    <p className="mt-2 text-xs">Odpowiedzi opierają się na katalogu sklepu. Asystent nie zastępuje lekarza weterynarii ani nie potwierdza wymagań konkretnego zwierzęcia.</p>
                                </div>
                            )}

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role !== 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20 mt-1">
                                            <Bot size={14} className="text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] break-words whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${message.role === 'user'
                                            ? 'bg-primary text-black font-medium order-1 rounded-br-none'
                                            : 'bg-white/10 text-gray-100 border border-white/5 rounded-bl-none'
                                            }`}
                                    >
                                        {message.content}
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20 mt-1">
                                            <User size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20">
                                        <Bot size={14} className="text-primary" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl px-4 py-3 rounded-bl-none flex gap-1 items-center">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/20 p-3 backdrop-blur-md sm:p-4">
                            <div className="relative flex items-center">
                                <input
                                    aria-label="Wiadomość do asystenta"
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Napisz wiadomość..."
                                    disabled={isLoading}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-400 disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    aria-label="Wyślij wiadomość"
                                    className="absolute right-2 p-2 bg-primary rounded-lg text-black hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                onClick={() => setPanelOpen(!isOpenRef.current)}
                aria-label={isOpen ? 'Zamknij czat' : 'Otwórz czat'}
                type="button"
                className="relative z-50 flex h-12 w-12 self-end items-center justify-center rounded-full bg-primary text-black shadow-surface transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-14 sm:w-14"
            >
                {isOpen ? <X size={24} strokeWidth={2.5} /> : <MessageCircle size={24} strokeWidth={2.5} />}

                {!isOpen && hasUnreadResponse && (
                    <span role="status" aria-label="Nowa odpowiedź" className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full border-2 border-black bg-red-500"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default ChatWidget;
