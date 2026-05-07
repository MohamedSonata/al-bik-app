# Order Creation Feature - Design Document

## Overview

This design document specifies the architecture and implementation details for the order creation feature in the Al-Baik restaurant website. The system enables customers to build a shopping cart, manage items with customizations (addons), provide delivery information, and submit orders to the POS backend via Socket.IO real-time communication.

The design follows a layered architecture with clear separation of concerns:
- **Type Definitions Layer**: TypeScript interfaces and types
- **Utility Functions Layer**: Helper functions for UUID generation, addon matching, and calculations
- **Cart Store Layer**: State management using Zustand
- **Order Service Layer**: Socket.IO communication and order submission
- **UI Components Layer**: React components for cart, checkout, and success modal

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Browser                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React Application                      │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Cart Screen  │  │Checkout Screen│               │    │
│  │  └──────┬───────┘  └──────┬────────┘               │    │
│  │         │                  │                        │    │
│  │         └──────────┬───────┘                        │    │
│  │                    │                                │    │
│  │         ┌──────────▼──────────┐                     │    │
│  │         │   Cart Store        │                     │    │
│  │         │   (Zustand)         │                     │    │
│  │         └──────────┬──────────┘                     │    │
│  │                    │                                │    │
│  │         ┌──────────▼──────────┐                     │    │
│  │         │  Order Service      │                     │    │
│  │         └──────────┬──────────┘                     │    │
│  │                    │                                │    │
│  │         ┌──────────▼──────────┐                     │    │
│  │         │  Socket Service     │                     │    │
│  │         │  (Existing)         │                     │    │
│  │         └──────────┬──────────┘                     │    │
│  └────────────────────┼──────────────────────────────┘    │
│                       │                                    │
└───────────────────────┼────────────────────────────────────┘
                        │
                        │ Socket.IO (WebSocket)
                        │
┌───────────────────────▼────────────────────────────────────┐
│                  POS Backend Server                         │
│                                                             │
│  - Receives order requests                                  │
│  - Validates and processes orders                           │
│  - Sends order confirmations                                │
│  - Emits real-time status updates                           │
└─────────────────────────────────────────────────────────────┘
```

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components Layer                       │
│  CartScreen, CheckoutScreen, OrderSuccessModal              │
│  CustomerInfoForm, CartItemCard                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  State Management Layer                      │
│  Cart Store (Zustand)                                        │
│  - Cart state (items, totals)                                │
│  - Cart operations (add, update, remove, clear)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Service Layer                             │
│  Order Service                                               │
│  - Order submission with timeout                             │
│  - Customer validation                                       │
│  - Order status listening                                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Communication Layer                         │
│  Socket Service (Existing)                                   │
│  - Socket.IO connection management                           │
│  - Event emission and listening                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Utility Layer                             │
│  - UUID generation                                           │
│  - Addon matching                                            │
│  - Cart calculations                                         │
│  - Error message mapping                                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Adding Item to Cart:**
```
User Action → ProductModal
    ↓
CartStore.addItem(product, quantity, addons, notes)
    ↓
1. Validate quantity (1-99)
2. Check if matching item exists (findMatchingItem)
3. If exists: increment quantity
4. If new: create cart item with UUID
5. Recalculate totals (calculateTotals)
    ↓
Update cart state
    ↓
UI re-renders with updated cart
```

**Submitting Order:**
```
User clicks "Place Order" → CheckoutScreen
    ↓
Validate customer info
    ↓
Check cart not empty
    ↓
Check socket connected
    ↓
OrderService.submitOrder(customer, cart, orderNote)
    ↓
1. Generate request ID (UUID)
2. Convert cart items to order request format
3. Create order request payload
4. Emit "customer:order:create" event
5. Listen for response with 30s timeout
    ↓
Response received
    ↓
If success:
  - Show success modal
  - Clear cart
  - Navigate back
If error:
  - Map error code to message
  - Display error to user
```

## Components and Interfaces

### 1. Type Definitions Layer

**File**: `src/types/order.types.ts`

This module defines all TypeScript interfaces and types for the order creation feature.

```typescript
// ============================================================================
// Cart Types
// ============================================================================

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  isEmpty: boolean;
  itemCount: number;
}

export interface CartItem {
  id: string;                    // UUID v4
  productId: string;             // Product ID from menu
  name: string;                  // Product name
  price: number;                 // Product base price
  quantity: number;              // Quantity (1-99)
  addons: ProductAddon[];        // Selected add-ons
  notes?: string;                // Optional item notes
  subtotal: number;              // Calculated: (price + addons) * quantity
}

export interface ProductAddon {
  id: string;                    // Addon ID
  name: string;                  // Addon name
  price: number;                 // Addon price
  type: AddonType;               // Addon category
}

export type AddonType = 'extra' | 'sauce' | 'side' | 'topping';

// ============================================================================
// Customer Types
// ============================================================================

export interface CustomerInfo {
  name: string;                  // Customer name (2-100 chars)
  phone: string;                 // Phone number (required)
  deliveryType: DeliveryType;    // Pickup or delivery
  deliveryAddress?: string;      // Required if deliveryType is 'delivery'
}

export type DeliveryType = 'pickup' | 'delivery';

// ============================================================================
// Order Request Types (Socket.IO Payload)
// ============================================================================

export interface OrderRequest {
  customerSocketId: string;      // Socket connection ID
  requestId: string;              // Unique UUID for this request
  publicSeatId: string;           // Seat identifier
  customer: CustomerInfo;         // Customer details
  items: OrderRequestItem[];      // Cart items
  orderNote?: string;             // Optional order-level notes
  subtotal: number;               // Subtotal amount
  tax: number;                    // Tax amount
  total: number;                  // Total amount
  timestamp: string;              // ISO 8601 UTC timestamp
}

export interface OrderRequestItem {
  productId: string;              // Product ID
  name: string;                   // Product name
  price: number;                  // Product price
  quantity: number;               // Quantity (1-99)
  addons?: OrderRequestAddon[];   // Selected add-ons
  notes?: string;                 // Item-specific notes
}

export interface OrderRequestAddon {
  id: string;                     // Add-on ID
  name: string;                   // Add-on name
  price: number;                  // Add-on price
  type: string;                   // Add-on type
}

// ============================================================================
// Order Response Types (Socket.IO Response)
// ============================================================================

export interface OrderResponse {
  customerSocketId: string;       // Socket connection ID
  requestId: string;              // Matches the request ID
  success: boolean;               // Whether order was successful
  order?: OrderData;              // Present if success is true
  error?: OrderError;             // Present if success is false
}

export interface OrderData {
  id: string;                     // Order ID
  receiptNumber: string;          // Receipt number (e.g., "ORD-12345")
  status: OrderStatus;            // Order status
  total: number;                  // Order total
  items?: OrderItem[];            // List of order items
  subtotal?: number;              // Subtotal before tax
  tax?: number;                   // Tax amount
  discount?: number;              // Discount amount
  orderType?: string;             // 'DINE_IN', 'TAKEAWAY', 'DELIVERY'
  cashierName?: string;           // Cashier who processed
  paymentMethod?: string;         // 'CASH', 'CARD', etc.
  estimatedTime?: number;         // Estimated prep time (minutes)
  timestamp: string;              // ISO 8601 timestamp
}

export interface OrderItem {
  name: string;                   // Item name
  quantity: number;               // Quantity ordered
  price: number;                  // Price per unit
  subtotal: number;               // Subtotal for this item
}

export interface OrderError {
  code: string;                   // Error code
  message: string;                // Error message
}

export type OrderStatus = 
  | 'pending'      // Order received, awaiting confirmation
  | 'confirmed'    // Order confirmed by restaurant
  | 'preparing'    // Order is being prepared
  | 'ready'        // Order ready for pickup/delivery
  | 'completed'    // Order completed
  | 'cancelled';   // Order cancelled

// ============================================================================
// Order Status Update Types (Real-time)
// ============================================================================

export interface OrderStatusUpdate {
  orderId: string;                // Order ID
  status: OrderStatus;            // New status
  timestamp: string;              // ISO 8601 timestamp
  estimatedTime?: number;         // Updated estimated time (minutes)
  message?: string;               // Optional status message
}

// ============================================================================
// Error Types
// ============================================================================

export type OrderErrorCode =
  | 'PRODUCT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_CUSTOMER_INFO'
  | 'SEAT_NOT_FOUND'
  | 'ORDER_PROCESSING_FAILED'
  | 'CONNECTION_LOST'
  | 'TIMEOUT';
```

### 2. Utility Functions Layer

**File**: `src/utils/order.utils.ts`

This module provides pure utility functions for cart operations.

```typescript
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
```

### 3. Cart Store Layer

**File**: `src/stores/cart.store.ts`

This module manages cart state using Zustand.

```typescript
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
```


### 4. Order Service Layer

**File**: `src/services/order.service.ts`

This module handles order submission and communication with the POS backend via Socket.IO.

```typescript
import type { Socket } from 'socket.io-client';
import type {
  CustomerInfo,
  Cart,
  OrderRequest,
  OrderResponse,
  OrderRequestItem,
  OrderStatusUpdate
} from '@/types/order.types';
import { generateUUID } from '@/utils/order.utils';

// ============================================================================
// Order Service Class
// ============================================================================

export class OrderService {
  private socket: Socket | null = null;
  private currentSeatId: string | null = null;

  /**
   * Sets the socket instance from the existing socket service
   * @param socket - Socket.IO client instance
   */
  setSocket(socket: Socket): void {
    this.socket = socket;
  }

  /**
   * Sets the current seat ID after successful seat connection
   * @param seatId - Public seat ID
   */
  setCurrentSeatId(seatId: string): void {
    this.currentSeatId = seatId;
  }

  /**
   * Submits an order to the POS backend
   * @param customer - Customer information
   * @param cart - Cart with items and totals
   * @param orderNote - Optional order-level notes
   * @returns Promise resolving to order response
   * @throws Error if validation fails or submission fails
   */
  async submitOrder(
    customer: CustomerInfo,
    cart: Cart,
    orderNote?: string
  ): Promise<OrderResponse> {
    // Validate customer information
    const validationError = this.validateCustomerInfo(customer);
    if (validationError) {
      throw new Error(validationError);
    }

    // Validate cart is not empty
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Check socket connection
    if (!this.socket || !this.socket.connected) {
      throw new Error('Connection lost. Please check your internet and try again.');
    }

    // Check seat ID is set
    if (!this.currentSeatId) {
      throw new Error('No seat connected');
    }

    // Generate unique request ID
    const requestId = generateUUID();
    const customerSocketId = this.socket.id || '';

    // Convert cart items to order request items
    const orderItems: OrderRequestItem[] = cart.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      addons: item.addons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        type: addon.type
      })),
      notes: item.notes
    }));

    // Create order request payload
    const orderRequest: OrderRequest = {
      customerSocketId,
      requestId,
      publicSeatId: this.currentSeatId,
      customer,
      items: orderItems,
      orderNote,
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      timestamp: new Date().toISOString()
    };

    // Submit order with 30 second timeout
    return this.emitWithTimeout<OrderResponse>(
      'customer:order:create',
      orderRequest,
      'customer:order:create:response',
      30000
    );
  }

  /**
   * Starts listening for order status updates
   * @param orderId - Order ID to filter updates
   * @param onUpdate - Callback function for status updates
   */
  listenForOrderStatusUpdates(
    orderId: string,
    onUpdate: (update: OrderStatusUpdate) => void
  ): void {
    if (!this.socket) return;

    this.socket.on('customer:order:status:update', (update: OrderStatusUpdate) => {
      // Filter by order ID
      if (update.orderId === orderId) {
        onUpdate(update);
      }
    });
  }

  /**
   * Stops listening for order status updates
   */
  stopListeningForOrderStatus(): void {
    if (!this.socket) return;
    this.socket.off('customer:order:status:update');
  }

  /**
   * Emits a Socket.IO event and waits for response with timeout
   * @param eventName - Event to emit
   * @param data - Event payload
   * @param responseEvent - Event to listen for response
   * @param timeout - Timeout in milliseconds
   * @returns Promise resolving to response data
   * @throws Error if timeout or error occurs
   */
  private emitWithTimeout<T>(
    eventName: string,
    data: any,
    responseEvent: string,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      let timeoutId: NodeJS.Timeout;
      let responseReceived = false;

      // Setup timeout
      timeoutId = setTimeout(() => {
        if (!responseReceived) {
          this.socket!.off(responseEvent);
          this.socket!.off('customer:error');
          this.socket!.off('customer:timeout');
          reject(new Error('Request timed out. Please check your connection and try again.'));
        }
      }, timeout);

      // Listen for success response (one-time)
      this.socket.once(responseEvent, (response: T) => {
        responseReceived = true;
        clearTimeout(timeoutId);
        this.socket!.off('customer:error');
        this.socket!.off('customer:timeout');
        resolve(response);
      });

      // Listen for error events
      this.socket.once('customer:error', (error: any) => {
        responseReceived = true;
        clearTimeout(timeoutId);
        this.socket!.off(responseEvent);
        this.socket!.off('customer:timeout');
        reject(new Error(error.message || 'An error occurred. Please try again.'));
      });

      // Listen for timeout events from server
      this.socket.once('customer:timeout', () => {
        responseReceived = true;
        clearTimeout(timeoutId);
        this.socket!.off(responseEvent);
        this.socket!.off('customer:error');
        reject(new Error('Server is taking too long to respond. Please try again.'));
      });

      // Emit the event
      this.socket.emit(eventName, data);
    });
  }

  /**
   * Validates customer information
   * @param customer - Customer info to validate
   * @returns Error message if invalid, null if valid
   */
  private validateCustomerInfo(customer: CustomerInfo): string | null {
    // Validate name
    const trimmedName = customer.name.trim();
    if (trimmedName.length === 0) {
      return 'Name is required';
    }
    if (trimmedName.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmedName.length > 100) {
      return 'Name must not exceed 100 characters';
    }

    // Validate phone
    if (customer.phone.trim().length === 0) {
      return 'Phone number is required';
    }

    // Validate delivery address if delivery type is delivery
    if (customer.deliveryType === 'delivery') {
      if (!customer.deliveryAddress || customer.deliveryAddress.trim().length === 0) {
        return 'Delivery address is required';
      }
      if (customer.deliveryAddress.trim().length < 10) {
        return 'Address must be at least 10 characters';
      }
    }

    return null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const orderService = new OrderService();
```

### 5. UI Components Layer

This layer consists of React components for the user interface.

#### 5.1 Cart Item Card Component

**File**: `src/components/cart/CartItemCard.tsx`

```typescript
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CartItem } from '@/types/order.types';

interface CartItemCardProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItemCard({
  item,
  onIncrement,
  onDecrement,
  onRemove
}: CartItemCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Item Details */}
          <div className="flex-1">
            <h3 className="font-semibold text-base">{item.name}</h3>
            
            {/* Addons */}
            {item.addons.length > 0 && (
              <div className="mt-1 text-sm text-muted-foreground">
                {item.addons.map(addon => addon.name).join(', ')}
              </div>
            )}
            
            {/* Notes */}
            {item.notes && (
              <div className="mt-1 text-sm text-muted-foreground italic">
                Note: {item.notes}
              </div>
            )}
            
            {/* Price */}
            <div className="mt-2 font-medium">
              {item.price.toFixed(2)} JD
              {item.addons.length > 0 && (
                <span className="text-sm text-muted-foreground ml-1">
                  + {item.addons.reduce((sum, a) => sum + a.price, 0).toFixed(2)} JD
                </span>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onDecrement}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span className="w-8 text-center font-medium">
                {item.quantity}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={onIncrement}
                disabled={item.quantity >= 99}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Subtotal */}
            <div className="font-semibold">
              {item.subtotal.toFixed(2)} JD
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 5.2 Cart Screen Component

**File**: `src/components/cart/CartScreen.tsx`

```typescript
import React from 'react';
import { useNavigate } from 'wouter';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart.store';
import { CartItemCard } from './CartItemCard';
import { useTranslation } from 'react-i18next';

export function CartScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem } = useCartStore();

  const handleCheckout = () => {
    if (cart.isEmpty) return;
    navigate('/checkout');
  };

  // Empty cart state
  if (cart.isEmpty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Cart</h1>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Add items from the menu to get started
            </p>
            <Button onClick={() => navigate('/menu')}>
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/menu')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map(item => (
            <CartItemCard
              key={item.id}
              item={item}
              onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{cart.subtotal.toFixed(2)} JD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{cart.tax.toFixed(2)} JD</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{cart.total.toFixed(2)} JD</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### 5.3 Customer Info Form Component

**File**: `src/components/checkout/CustomerInfoForm.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { CustomerInfo, DeliveryType } from '@/types/order.types';

interface CustomerInfoFormProps {
  onChanged: (info: CustomerInfo | null, isValid: boolean) => void;
}

export function CustomerInfoForm({ onChanged }: CustomerInfoFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Validate and notify parent
  useEffect(() => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = deliveryAddress.trim();

    // Validation
    const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 100;
    const isPhoneValid = trimmedPhone.length > 0;
    const isAddressValid = 
      deliveryType === 'pickup' || 
      (deliveryType === 'delivery' && trimmedAddress.length >= 10);

    const isValid = isNameValid && isPhoneValid && isAddressValid;

    if (isValid) {
      const customerInfo: CustomerInfo = {
        name: trimmedName,
        phone: trimmedPhone,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? trimmedAddress : undefined
      };
      onChanged(customerInfo, true);
    } else {
      onChanged(null, false);
    }
  }, [name, phone, deliveryType, deliveryAddress, onChanged]);

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        {name.trim().length > 0 && name.trim().length < 2 && (
          <p className="text-sm text-destructive">
            Name must be at least 2 characters
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* Delivery Type */}
      <div className="space-y-2">
        <Label>
          Delivery Type <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={deliveryType}
          onValueChange={(value) => setDeliveryType(value as DeliveryType)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="font-normal cursor-pointer">
              Pickup
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="font-normal cursor-pointer">
              Delivery
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Delivery Address (conditional) */}
      {deliveryType === 'delivery' && (
        <div className="space-y-2">
          <Label htmlFor="address">
            Delivery Address <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="address"
            placeholder="Enter your delivery address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={3}
          />
          {deliveryAddress.trim().length > 0 && deliveryAddress.trim().length < 10 && (
            <p className="text-sm text-destructive">
              Address must be at least 10 characters
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```


#### 5.4 Checkout Screen Component

**File**: `src/components/checkout/CheckoutScreen.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'wouter';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCartStore } from '@/stores/cart.store';
import { orderService } from '@/services/order.service';
import { socketService } from '@/services/socket.service';
import { CustomerInfoForm } from './CustomerInfoForm';
import { OrderSuccessModal } from './OrderSuccessModal';
import { getErrorMessage } from '@/utils/order.utils';
import type { CustomerInfo, OrderData } from '@/types/order.types';

export function CheckoutScreen() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);

  // Redirect if cart is empty
  if (cart.isEmpty) {
    navigate('/menu');
    return null;
  }

  const handleFormChanged = (info: CustomerInfo | null, isValid: boolean) => {
    setCustomerInfo(info);
    setIsFormValid(isValid);
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid || !customerInfo || isSubmitting) {
      return;
    }

    if (cart.isEmpty) {
      setError('Cart is empty');
      return;
    }

    // Check connection
    if (!socketService.isConnected) {
      setIsConnected(false);
      setError('Connection lost. Please reconnect and try again.');
      return;
    }

    setIsSubmitting(true);
    setIsConnected(true);
    setError(null);

    try {
      // Submit order
      const response = await orderService.submitOrder(customerInfo, cart);

      if (response.success && response.order) {
        // Show success dialog
        setOrderData(response.order);
        setShowSuccess(true);
        
        // Clear cart
        clearCart();
      } else {
        // Handle error response
        const errorMessage = getErrorMessage(response.error?.code);
        setError(errorMessage);
      }
    } catch (err: any) {
      // Handle timeout or connection errors
      const isConnectionError = 
        err.message.includes('Connection lost') ||
        err.message.includes('connection');

      if (isConnectionError) {
        setIsConnected(false);
      }

      const errorMessage = isConnectionError
        ? 'Connection lost during order submission'
        : err.message || 'Order submission failed. Please try again.';
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/menu');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerInfoForm onChanged={handleFormChanged} />
            </CardContent>
          </Card>

          {/* Order Summary (Mobile - Collapsible) */}
          <Card className="lg:hidden">
            <Collapsible
              open={isOrderSummaryExpanded}
              onOpenChange={setIsOrderSummaryExpanded}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle>Order Summary</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {cart.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>{item.subtotal.toFixed(2)} JD</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{cart.subtotal.toFixed(2)} JD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{cart.tax.toFixed(2)} JD</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{cart.total.toFixed(2)} JD</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* Order Summary (Desktop - Sticky) */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="flex-1">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {item.subtotal.toFixed(2)} JD
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{cart.subtotal.toFixed(2)} JD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{cart.tax.toFixed(2)} JD</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{cart.total.toFixed(2)} JD</span>
              </div>

              {/* Connection Status */}
              {!isConnected && (
                <Alert variant="destructive">
                  <WifiOff className="h-4 w-4" />
                  <AlertDescription>
                    Connection lost. Please check your internet.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Place Order Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={!isFormValid || isSubmitting || !isConnected}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Place Order Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        {!isConnected && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Connection lost. Please check your internet.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold">{cart.total.toFixed(2)} JD</span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePlaceOrder}
          disabled={!isFormValid || isSubmitting || !isConnected}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Placing Order...
            </>
          ) : (
            'Place Order'
          )}
        </Button>
      </div>

      {/* Success Modal */}
      {showSuccess && orderData && (
        <OrderSuccessModal
          orderData={orderData}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
}
```

#### 5.5 Order Success Modal Component

**File**: `src/components/checkout/OrderSuccessModal.tsx`

```typescript
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatOrderStatus } from '@/utils/order.utils';
import type { OrderData } from '@/types/order.types';

interface OrderSuccessModalProps {
  orderData: OrderData;
  onClose: () => void;
}

export function OrderSuccessModal({ orderData, onClose }: OrderSuccessModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-2xl">Order Placed Successfully!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Your order has been received and is being processed
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Number */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Receipt Number</p>
            <p className="text-2xl font-bold">{orderData.receiptNumber}</p>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{formatOrderStatus(orderData.status)}</span>
            </div>

            {orderData.estimatedTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Time</span>
                <span className="font-medium">{orderData.estimatedTime} minutes</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-lg">
                {orderData.total.toFixed(2)} JD
              </span>
            </div>
          </div>

          {/* Order Items */}
          {orderData.items && orderData.items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="font-semibold text-sm">Order Items</p>
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{item.subtotal.toFixed(2)} JD</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full" size="lg">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Data Models

### Cart State Model

```typescript
{
  items: [
    {
      id: "uuid-1",
      productId: "prod-001",
      name: "Cheeseburger",
      price: 12.99,
      quantity: 2,
      addons: [
        {
          id: "addon-001",
          name: "Extra Cheese",
          price: 1.50,
          type: "extra"
        }
      ],
      notes: "No onions",
      subtotal: 28.98  // (12.99 + 1.50) * 2
    }
  ],
  subtotal: 28.98,
  tax: 0.00,
  total: 28.98,
  isEmpty: false,
  itemCount: 2
}
```

### Order Request Model

```typescript
{
  customerSocketId: "abc123xyz",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  publicSeatId: "RESTINTRJ",
  customer: {
    name: "John Doe",
    phone: "+962791234567",
    deliveryType: "pickup"
  },
  items: [
    {
      productId: "prod-001",
      name: "Cheeseburger",
      price: 12.99,
      quantity: 2,
      addons: [
        {
          id: "addon-001",
          name: "Extra Cheese",
          price: 1.50,
          type: "extra"
        }
      ],
      notes: "No onions"
    }
  ],
  subtotal: 28.98,
  tax: 0.00,
  total: 28.98,
  timestamp: "2026-05-07T10:30:00.000Z"
}
```

### Order Response Model

```typescript
{
  customerSocketId: "abc123xyz",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  success: true,
  order: {
    id: "order-12345",
    receiptNumber: "ORD-12345",
    status: "pending",
    total: 28.98,
    items: [
      {
        name: "Cheeseburger",
        quantity: 2,
        price: 12.99,
        subtotal: 25.98
      }
    ],
    subtotal: 28.98,
    tax: 0.00,
    estimatedTime: 15,
    timestamp: "2026-05-07T10:30:05.000Z"
  }
}
```

## Error Handling

### Error Types and Handling Strategy

**1. Validation Errors**
- Caught before submission
- Display inline validation messages
- Prevent form submission

**2. Connection Errors**
- Check socket connection before submission
- Display connection status indicator
- Show reconnection prompt

**3. Timeout Errors**
- 30-second timeout for order submission
- Display timeout message with retry option
- Clean up event listeners

**4. Server Errors**
- Map error codes to user-friendly messages
- Display error alert
- Allow user to retry

**5. Network Errors**
- Detect connection loss during submission
- Display network error message
- Suggest checking internet connection

### Error Message Mapping

| Error Code | User Message |
|------------|--------------|
| `PRODUCT_UNAVAILABLE` | One or more products are currently unavailable |
| `INSUFFICIENT_STOCK` | Insufficient stock for requested quantity |
| `INVALID_CUSTOMER_INFO` | Invalid customer information |
| `SEAT_NOT_FOUND` | Seat not found. Please scan the QR code again |
| `CONNECTION_LOST` | Connection lost. Please check your internet and try again |
| `TIMEOUT` | Request timed out. Please check your connection and try again |
| `ORDER_PROCESSING_FAILED` | Order submission failed. Please try again |

### Error Handling Flow

```
Error Occurs
    ↓
Identify Error Type
    ↓
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Validation  │ Connection   │ Timeout      │ Server       │
│ Error       │ Error        │ Error        │ Error        │
└─────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
Show inline    Show connection  Show timeout   Map error code
validation     warning          message        to message
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                     │
                     ▼
            Display Error to User
                     │
                     ▼
            Allow Retry/Correction
```

## Testing Strategy

### Unit Tests

**Cart Store Tests:**
- Add item to empty cart
- Add same item (increment quantity)
- Add item with different addons (create new item)
- Update item quantity
- Remove item from cart
- Clear cart
- Validate quantity limits (1-99)
- Calculate totals correctly

**Utility Function Tests:**
- UUID generation format
- Addon matching logic
- Cart calculation accuracy
- Error message mapping

**Order Service Tests:**
- Customer info validation
- Order request payload creation
- Socket event emission
- Timeout handling
- Error response handling

### Integration Tests

**Cart to Checkout Flow:**
- Add items to cart
- Navigate to checkout
- Fill customer info
- Submit order
- Verify cart cleared on success

**Socket.IO Communication:**
- Connect to socket
- Emit order create event
- Receive order response
- Handle timeout
- Handle error events

### End-to-End Tests

**Complete Order Flow:**
1. Browse menu
2. Add items to cart with addons
3. View cart
4. Proceed to checkout
5. Fill customer information
6. Submit order
7. Verify success modal
8. Verify cart cleared

**Error Scenarios:**
- Submit with invalid customer info
- Submit with empty cart
- Submit while disconnected
- Handle timeout
- Handle server error

## Integration Points

### Socket Service Integration

The order service integrates with the existing `socketService` from `src/services/socket.service.ts`:

```typescript
// In app initialization or context provider
import { socketService } from '@/services/socket.service';
import { orderService } from '@/services/order.service';

// Connect socket
const socket = socketService.connect();

// Set socket in order service
orderService.setSocket(socket);

// After seat connection
const seatResponse = await socketService.connectToSeat();
if (seatResponse.success && seatResponse.seat) {
  orderService.setCurrentSeatId(seatResponse.seat.publicSeatId);
}
```

### i18n Integration

All user-facing text should use i18n translation keys:

```typescript
// Add to src/messages/en.json
{
  "cart": {
    "title": "Cart",
    "empty": "Your cart is empty",
    "emptyDescription": "Add items from the menu to get started",
    "browseMenu": "Browse Menu",
    "proceedToCheckout": "Proceed to Checkout",
    "subtotal": "Subtotal",
    "tax": "Tax",
    "total": "Total",
    "remove": "Remove"
  },
  "checkout": {
    "title": "Checkout",
    "customerInfo": "Customer Information",
    "orderSummary": "Order Summary",
    "name": "Name",
    "phone": "Phone Number",
    "deliveryType": "Delivery Type",
    "pickup": "Pickup",
    "delivery": "Delivery",
    "deliveryAddress": "Delivery Address",
    "placeOrder": "Place Order",
    "placingOrder": "Placing Order...",
    "connectionLost": "Connection lost. Please check your internet.",
    "required": "Required"
  },
  "orderSuccess": {
    "title": "Order Placed Successfully!",
    "description": "Your order has been received and is being processed",
    "receiptNumber": "Receipt Number",
    "status": "Status",
    "estimatedTime": "Estimated Time",
    "orderItems": "Order Items",
    "done": "Done"
  },
  "errors": {
    "cartEmpty": "Cart is empty",
    "nameRequired": "Name is required",
    "nameTooShort": "Name must be at least 2 characters",
    "nameTooLong": "Name must not exceed 100 characters",
    "phoneRequired": "Phone number is required",
    "addressRequired": "Delivery address is required",
    "addressTooShort": "Address must be at least 10 characters",
    "quantityInvalid": "Quantity must be between 1 and 99",
    "productUnavailable": "One or more products are currently unavailable",
    "insufficientStock": "Insufficient stock for requested quantity",
    "invalidCustomerInfo": "Invalid customer information",
    "connectionLost": "Connection lost. Please check your internet and try again",
    "timeout": "Request timed out. Please check your connection and try again",
    "orderFailed": "Order submission failed. Please try again"
  }
}
```

### shadcn/ui Components

The design uses existing shadcn/ui components:
- `Button` - For actions
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - For containers
- `Dialog` - For success modal
- `Input`, `Textarea` - For form fields
- `Label` - For form labels
- `RadioGroup`, `RadioGroupItem` - For delivery type selection
- `Separator` - For visual separation
- `Alert`, `AlertDescription` - For error messages
- `Collapsible` - For mobile order summary

## Security Considerations

### Input Validation

All user inputs are validated:
- Customer name: 2-100 characters, trimmed
- Phone number: non-empty, trimmed
- Delivery address: 10+ characters if delivery type is delivery
- Quantity: 1-99 range
- Notes: optional, no length limit (consider adding max length)

### Socket.IO Security

- Use WSS (WebSocket Secure) in production
- Validate all incoming data from server
- Don't trust client-side data on server
- Implement rate limiting on server

### Data Sanitization

- Trim all string inputs
- Validate data types
- Limit string lengths
- Escape special characters if needed

## Performance Optimization

### State Management

- Use Zustand for lightweight state management
- Memoize cart calculations
- Avoid unnecessary re-renders

### Socket.IO

- Clean up event listeners properly
- Use `once` for single-use events
- Implement connection pooling if needed

### UI Rendering

- Lazy load components
- Virtualize long lists if needed
- Optimize re-renders with React.memo

## Deployment Considerations

### Environment Variables

```env
VITE_SOCKET_URL=wss://your-pos-server.com
```

### Build Configuration

Ensure Socket.IO client is properly bundled:

```typescript
// vite.config.ts
export default defineConfig({
  // ... other config
  optimizeDeps: {
    include: ['socket.io-client']
  }
});
```

### Production Checklist

- [ ] Use WSS for Socket.IO connection
- [ ] Enable error logging
- [ ] Implement analytics tracking
- [ ] Test timeout scenarios
- [ ] Test connection loss scenarios
- [ ] Verify mobile responsiveness
- [ ] Test with real POS backend
- [ ] Verify i18n translations
- [ ] Test accessibility
- [ ] Performance testing

## Summary

This design document provides a comprehensive architecture for the order creation feature with:

1. **Clear Separation of Concerns**: Five distinct layers (types, utilities, store, service, UI)
2. **Type Safety**: Complete TypeScript definitions for all data structures
3. **Reusable Utilities**: Pure functions for common operations
4. **Centralized State**: Zustand store for cart management
5. **Robust Communication**: Order service with timeout and error handling
6. **User-Friendly UI**: React components with proper validation and feedback
7. **Integration Ready**: Works with existing socket service and i18n setup
8. **Error Resilient**: Comprehensive error handling and user feedback
9. **Testable**: Clear interfaces for unit and integration testing
10. **Production Ready**: Security, performance, and deployment considerations

The implementation follows React and TypeScript best practices, uses existing project patterns, and provides a solid foundation for the order creation feature.
