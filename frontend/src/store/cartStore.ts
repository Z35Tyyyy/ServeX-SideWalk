import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export interface CartItem { menuItemId: string; name: string; price: number; quantity: number; specialInstructions: string; imageUrl?: string; }

interface CartState {
    tableId: string | null;
    items: CartItem[];
    lastActivityAt: number | null;
    setTableId: (tableId: string) => void;
    addItem: (item: Omit<CartItem, 'quantity' | 'specialInstructions'>) => void;
    removeItem: (menuItemId: string) => void;
    updateQuantity: (menuItemId: string, quantity: number) => void;
    updateInstructions: (menuItemId: string, instructions: string) => void;
    clearCart: () => void;
    getSubtotal: () => number;
    getSGST: () => number;
    getCGST: () => number;
    getTotal: () => number;
    getItemCount: () => number;
    checkExpiry: () => boolean; // Returns true if expired and cart was cleared
    isExpired: () => boolean;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            tableId: null,
            items: [],
            lastActivityAt: null,
            setTableId: (tableId) => set({ tableId, lastActivityAt: Date.now() }),
            addItem: (item) => {
                const items = get().items;
                const existing = items.find((i) => i.menuItemId === item.menuItemId);
                if (existing) set({ items: items.map((i) => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i), lastActivityAt: Date.now() });
                else set({ items: [...items, { ...item, quantity: 1, specialInstructions: '' }], lastActivityAt: Date.now() });
            },
            removeItem: (menuItemId) => set({ items: get().items.filter((i) => i.menuItemId !== menuItemId), lastActivityAt: Date.now() }),
            updateQuantity: (menuItemId, quantity) => {
                if (quantity <= 0) set({ items: get().items.filter((i) => i.menuItemId !== menuItemId), lastActivityAt: Date.now() });
                else set({ items: get().items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity } : i), lastActivityAt: Date.now() });
            },
            updateInstructions: (menuItemId, instructions) => set({ items: get().items.map((i) => i.menuItemId === menuItemId ? { ...i, specialInstructions: instructions } : i), lastActivityAt: Date.now() }),
            clearCart: () => set({ items: [], lastActivityAt: null }),
            getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            getSGST: () => Math.round(get().getSubtotal() * 0.025 * 100) / 100,
            getCGST: () => Math.round(get().getSubtotal() * 0.025 * 100) / 100,
            getTotal: () => Math.round((get().getSubtotal() + get().getSGST() + get().getCGST()) * 100) / 100,
            getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
            isExpired: () => {
                const { lastActivityAt, items } = get();
                if (!lastActivityAt || items.length === 0) return false;
                return Date.now() - lastActivityAt > IDLE_TIMEOUT_MS;
            },
            checkExpiry: () => {
                if (get().isExpired()) {
                    get().clearCart();
                    return true;
                }
                return false;
            },
        }),
        { name: 'cart-storage' }
    )
);
