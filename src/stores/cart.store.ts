import { create } from 'zustand';
import type { Cart, CartItem, ProductAddon } from '@/types/order.types';
import type { MenuProduct } from '@/types/seat.types';
import {
  generateUUID,
  findMatchingItem,
  calculateTotals,
  validateQuantity
} from '@/utils/order.utils';

// ============================================================================
// Cart Store Interface
// ============================================================================

interface CartStore {
  cart: Cart;
  addItem: (
    product: MenuProduct,
    quantity?: number,
    addons?: ProductAddon[],
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  isEmpty: true,
  itemCount: 0
};

// ============================================================================
// Cart Store Implementation
// ============================================================================

export const useCartStore = create<CartStore>((set, get) => ({
  cart: initialCart,

  /**
   * Adds an item to the cart
   * If item with same product and addons exists, increments quantity
   * Otherwise creates new cart item
   */
  addItem: (product, quantity = 1, addons = [], notes) => {
    const { cart } = get();

    // Validate quantity
    validateQuantity(quantity);

    // Check if item with same product and addons exists
    const existingItemIndex = findMatchingItem(cart.items, product.id, addons);

    let updatedItems: CartItem[];

    if (existingItemIndex !== null) {
      // Item exists, increment quantity
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 99) {
        throw new Error('Cannot add more than 99 of the same item');
      }

      updatedItems = [...cart.items];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity
      };
    } else {
      // New item, add to cart
      const newItem: CartItem = {
        id: generateUUID(),
        productId: product.id,
        name: product.name,
        price: product.discountedPrice ?? product.price,
        quantity: quantity,
        addons: addons,
        notes: notes,
        subtotal: 0 // Will be calculated
      };

      updatedItems = [...cart.items, newItem];
    }

    // Calculate totals and update state
    const updatedCart = calculateTotals(updatedItems);
    set({ cart: updatedCart });
  },

  /**
   * Updates the quantity of a cart item
   * If quantity is 0, removes the item
   */
  updateQuantity: (cartItemId, quantity) => {
    const { cart } = get();

    if (quantity < 0 || quantity > 99) {
      throw new Error('Quantity must be between 0 and 99');
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      get().removeItem(cartItemId);
      return;
    }

    // Update item quantity
    const updatedItems = cart.items.map(item =>
      item.id === cartItemId ? { ...item, quantity } : item
    );

    // Calculate totals and update state
    const updatedCart = calculateTotals(updatedItems);
    set({ cart: updatedCart });
  },

  /**
   * Removes an item from the cart
   */
  removeItem: (cartItemId) => {
    const { cart } = get();
    const updatedItems = cart.items.filter(item => item.id !== cartItemId);
    const updatedCart = calculateTotals(updatedItems);
    set({ cart: updatedCart });
  },

  /**
   * Clears all items from the cart
   */
  clearCart: () => {
    set({ cart: initialCart });
  }
}));
