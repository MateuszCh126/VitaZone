import { AsyncLocalStorage } from 'async_hooks';

export const contextStorage = new AsyncLocalStorage();
