import { create } from 'zustand';

export interface CartItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  coverImage: string;
  creator: { name: string; avatar: string };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

function loadCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem('gumroad_cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('gumroad_cart', JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadCart(),
  isOpen: false,

  addItem: (product) => {
    const items = get().items;
    const exists = items.find((i) => i.slug === product.slug);
    if (exists) {
      // Already in cart — don't duplicate for digital products
      return;
    }
    const newItems = [...items, { ...product, quantity: 1 }];
    saveCart(newItems);
    set({ items: newItems, isOpen: true });
  },

  removeItem: (slug) => {
    const newItems = get().items.filter((i) => i.slug !== slug);
    saveCart(newItems);
    set({ items: newItems });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getCount: () => {
    return get().items.length;
  },

  toggleCart: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },

  setCartOpen: (open) => {
    set({ isOpen: open });
  },
}));
