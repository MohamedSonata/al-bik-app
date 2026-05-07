import { v4 as uuidv4 } from 'uuid';
import type { CartItem, ProductAddon, Cart, OrderErrorCode } from '@/types/order.types';

// ============================================================================
// UUID Generation
// ============================================================================

/**
 * Generates a UUID v4 identifier
 * @returns UUID string in format "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function generateUUID(): string {
  return uuidv4();
}

// ============================================================================
// Addon Matching
// ============================================================================

/**
 * Checks if two addon lists are equivalent (same addons, order-independent)
 * @param addons1 - First addon list
 * @param addons2 - Second addon list
 * @returns true if addon lists match, false otherwise
 */
export function addonsMatch(
  addons1: ProductAddon[],
  addons2: ProductAddon[]
): boolean {
  if (addons1.length !== addons2.length) {
    return false;
  }

  // Sort by ID for comparison
  const sorted1 = [...addons1].sort((a, b) => a.id.localeCompare(b.id));
  const sorted2 = [...addons2].sort((a, b) => a.id.localeCompare(b.id));

  // Compare each addon ID
  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i].id !== sorted2[i].id) {
      return false;
    }
  }

  return true;
}

/**
 * Finds a matching cart item by product ID and addons
 * @param items - Array of cart items
 * @param productId - Product ID to match
 * @param addons - Addons to match
 * @returns Index of matching item, or null if not found
 */
export function findMatchingItem(
  items: CartItem[],
  productId: string,
  addons: ProductAddon[]
): number | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.productId !== productId) {
      continue;
    }

    // Check if addons match
    if (addonsMatch(item.addons, addons)) {
      return i;
    }
  }

  return null;
}

// ============================================================================
// Cart Calculations
// ============================================================================

/**
 * Calculates cart totals from items
 * @param items - Array of cart items
 * @returns Complete cart object with calculated totals
 */
export function calculateTotals(items: CartItem[]): Cart {
  if (items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      isEmpty: true,
      itemCount: 0
    };
  }

  // Calculate subtotal and update item subtotals
  const subtotal = items.reduce((sum, item) => {
    // Base price * quantity
    const basePrice = item.price * item.quantity;
    
    // Addon prices * quantity
    const addonsPrice = item.addons.reduce(
      (addonSum, addon) => addonSum + (addon.price * item.quantity),
      0
    );
    
    // Update item subtotal
    item.subtotal = basePrice + addonsPrice;
    
    return sum + item.subtotal;
  }, 0);

  // Tax is 0% as per requirements
  const tax = 0;

  // Calculate total
  const total = subtotal + tax;

  // Calculate item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    tax,
    total,
    isEmpty: false,
    itemCount
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates quantity is within allowed range
 * @param quantity - Quantity to validate
 * @throws Error if quantity is invalid
 */
export function validateQuantity(quantity: number): void {
  if (quantity < 1 || quantity > 99) {
    throw new Error('Quantity must be between 1 and 99');
  }
}

// ============================================================================
// Error Message Mapping
// ============================================================================

/**
 * Maps error codes to user-friendly messages
 * @param errorCode - Error code from backend
 * @returns User-friendly error message
 */
export function getErrorMessage(errorCode?: OrderErrorCode | string): string {
  switch (errorCode) {
    case 'PRODUCT_UNAVAILABLE':
      return 'One or more products are currently unavailable';
    case 'INSUFFICIENT_STOCK':
      return 'Insufficient stock for requested quantity';
    case 'INVALID_CUSTOMER_INFO':
      return 'Invalid customer information';
    case 'SEAT_NOT_FOUND':
      return 'Seat not found. Please scan the QR code again';
    case 'CONNECTION_LOST':
      return 'Connection lost. Please check your internet and try again';
    case 'TIMEOUT':
      return 'Request timed out. Please check your connection and try again';
    case 'ORDER_PROCESSING_FAILED':
    default:
      return 'Order submission failed. Please try again';
  }
}

/**
 * Formats order status for display
 * @param status - Order status
 * @returns Formatted status string
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending Confirmation',
    'confirmed': 'Confirmed',
    'preparing': 'Being Prepared',
    'ready': 'Ready for Pickup',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
}
