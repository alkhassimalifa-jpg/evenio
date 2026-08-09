import { create } from "zustand";

interface CartItem {
  ticketId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutState {
  eventId: string | null;
  eventTitle: string | null;
  items: CartItem[];
  setCheckout: (eventId: string, eventTitle: string, items: CartItem[]) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  eventId: null,
  eventTitle: null,
  items: [],
  setCheckout: (eventId, eventTitle, items) => set({ eventId, eventTitle, items }),
  clear: () => set({ eventId: null, eventTitle: null, items: [] }),
}));