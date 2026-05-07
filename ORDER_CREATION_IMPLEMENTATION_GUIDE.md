# Order Creation Implementation Guide for Website Integration

## Overview

This guide documents the complete order creation flow implemented in the Flutter mobile app and provides specifications for implementing the same behavior in a website application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Socket.IO Events](#socketio-events)
3. [Data Models](#data-models)
4. [Cart Management](#cart-management)
5. [Order Submission Flow](#order-submission-flow)
6. [UI Components](#ui-components)
7. [Error Handling](#error-handling)
8. [Website Implementation Steps](#website-implementation-steps)

---

## 1. Architecture Overview

The order creation system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         UI Layer (Screens)              │
│  - CartScreen                           │
│  - CheckoutScreen                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      State Management (Cubit)           │
│  - CartCubit                            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Service Layer                      │
│  - SeatConnectionService                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Socket.IO Communication            │
│  - SocketIOManger                       │
└─────────────────────────────────────────┘
```

### Key Components

- **CartCubit**: Manages cart state (add, remove, update items)
- **SeatConnectionService**: Handles Socket.IO communication with POS system
- **CartScreen**: Displays cart items and totals
- **CheckoutScreen**: Collects customer info and submits orders

---

## 2. Socket.IO Events

### Event Names (from `socket_events.dart`)

```dart
// Order-related events
class CustomerEvents {
  // Order submission
  static const String customerOrderCreate = "customer:order:create";
  static const String customerOrderCreateResponse = "customer:order:create:response";
  
  // Order status updates
  static const String customerOrderStatusUpdate = "customer:order:status:update";
  
  // Error events
  static const String customerError = "customer:error";
  static const String customerTimeout = "customer:timeout";
}
```

### Event Flow Diagram

```
Client (Website)                    Server (POS System)
     │                                      │
     │  1. Emit: customer:order:create     │
     ├─────────────────────────────────────>│
     │                                      │
     │                                      │ (Processing order...)
     │                                      │
     │  2. Listen: customer:order:create:response
     │<─────────────────────────────────────┤
     │                                      │
     │  3. Listen: customer:order:status:update (optional)
     │<─────────────────────────────────────┤
     │                                      │
```

### Timeout Configuration

- **Order submission timeout**: 30 seconds
- **Other events timeout**: 10 seconds

---

## 3. Data Models

### 3.1 Order Request Payload

**Event**: `customer:order:create`

```typescript
interface OrderRequest {
  customerSocketId: string;      // Socket connection ID
  requestId: string;              // Unique UUID for this request
  publicSeatId: string;           // Seat identifier (e.g., "ABC123")
  customer: CustomerInfo;         // Customer details
  items: OrderRequestItem[];      // Cart items
  orderNote?: string;             // Optional order-level notes
  subtotal: number;               // Subtotal amount
  tax: number;                    // Tax amount
  total: number;                  // Total amount
  timestamp: string;              // ISO 8601 UTC timestamp
}

interface CustomerInfo {
  name: string;                   // Customer name (2-100 chars)
  phone: string;                  // Phone number
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;       // Required if deliveryType is 'delivery'
}

interface OrderRequestItem {
  productId: string;              // Product ID
  name: string;                   // Product name
  price: number;                  // Product price
  quantity: number;               // Quantity (1-99)
  addons?: OrderRequestAddon[];   // Selected add-ons
  notes?: string;                 // Item-specific notes
}

interface OrderRequestAddon {
  id: string;                     // Add-on ID
  name: string;                   // Add-on name
  price: number;                  // Add-on price
  type: string;                   // Add-on type (e.g., 'extra', 'sauce')
}
```

### Example Order Request

```json
{
  "customerSocketId": "abc123xyz",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "publicSeatId": "SEAT-001",
  "customer": {
    "name": "John Doe",
    "phone": "+1234567890",
    "deliveryType": "pickup",
    "deliveryAddress": null
  },
  "items": [
    {
      "productId": "prod-001",
      "name": "Cheeseburger",
      "price": 12.99,
      "quantity": 2,
      "addons": [
        {
          "id": "addon-001",
          "name": "Extra Cheese",
          "price": 1.50,
          "type": "extra"
        }
      ],
      "notes": "No onions"
    }
  ],
  "orderNote": "Please deliver to table 5",
  "subtotal": 28.98,
  "tax": 0.00,
  "total": 28.98,
  "timestamp": "2026-05-07T10:30:00.000Z"
}
```

---

### 3.2 Order Response Payload

**Event**: `customer:order:create:response`

```typescript
interface OrderResponse {
  customerSocketId: string;       // Socket connection ID
  requestId: string;              // Matches the request ID
  success: boolean;               // Whether order was successful
  order?: OrderData;              // Present if success is true
  error?: OrderError;             // Present if success is false
}

interface OrderData {
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

type OrderStatus = 
  | 'pending'      // Order received, awaiting confirmation
  | 'confirmed'    // Order confirmed by restaurant
  | 'preparing'    // Order is being prepared
  | 'ready'        // Order ready for pickup/delivery
  | 'completed'    // Order completed
  | 'cancelled';   // Order cancelled

interface OrderItem {
  name: string;                   // Item name
  quantity: number;               // Quantity ordered
  price: number;                  // Price per unit
  subtotal: number;               // Subtotal for this item
}

interface OrderError {
  code: string;                   // Error code
  message: string;                // Error message
}
```

### Example Success Response

```json
{
  "customerSocketId": "abc123xyz",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "order": {
    "id": "order-12345",
    "receiptNumber": "ORD-12345",
    "status": "pending",
    "total": 28.98,
    "items": [
      {
        "name": "Cheeseburger",
        "quantity": 2,
        "price": 12.99,
        "subtotal": 25.98
      }
    ],
    "subtotal": 28.98,
    "tax": 0.00,
    "discount": 0.00,
    "orderType": "DINE_IN",
    "cashierName": "Jane Smith",
    "paymentMethod": "PENDING",
    "estimatedTime": 15,
    "timestamp": "2026-05-07T10:30:05.000Z"
  }
}
```

### Example Error Response

```json
{
  "customerSocketId": "abc123xyz",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "success": false,
  "error": {
    "code": "PRODUCT_UNAVAILABLE",
    "message": "One or more products are currently unavailable"
  }
}
```

### Common Error Codes

- `PRODUCT_UNAVAILABLE`: Product is not available
- `INSUFFICIENT_STOCK`: Not enough stock for requested quantity
- `INVALID_CUSTOMER_INFO`: Customer information is invalid
- `SEAT_NOT_FOUND`: Seat ID is invalid or not found
- `ORDER_PROCESSING_FAILED`: General order processing error

---

### 3.3 Order Status Update (Real-time)

**Event**: `customer:order:status:update`

```typescript
interface OrderStatusUpdate {
  orderId: string;                // Order ID
  status: OrderStatus;            // New status
  timestamp: string;              // ISO 8601 timestamp
  estimatedTime?: number;         // Updated estimated time (minutes)
  message?: string;               // Optional status message
}
```

### Example Status Update

```json
{
  "orderId": "order-12345",
  "status": "preparing",
  "timestamp": "2026-05-07T10:32:00.000Z",
  "estimatedTime": 10,
  "message": "Your order is being prepared"
}
```

---

## 4. Cart Management

### 4.1 Cart State Structure

```typescript
interface Cart {
  items: CartItem[];              // List of cart items
  subtotal: number;               // Subtotal amount
  tax: number;                    // Tax amount (0% as per requirements)
  total: number;                  // Total amount
  isEmpty: boolean;               // Whether cart is empty
  itemCount: number;              // Total number of items
}

interface CartItem {
  id: string;                     // Unique cart item ID (UUID)
  productId: string;              // Product ID
  name: string;                   // Product name
  price: number;                  // Product price
  quantity: number;               // Quantity (1-99)
  addons: ProductAddon[];         // Selected add-ons
  notes?: string;                 // Item-specific notes
  subtotal: number;               // Item subtotal (calculated)
}

interface ProductAddon {
  id: string;                     // Add-on ID
  name: string;                   // Add-on name
  price: number;                  // Add-on price
  type: AddonType;                // Add-on type
}

type AddonType = 'extra' | 'sauce' | 'side' | 'topping';
```

---

### 4.2 Cart Operations

#### Add Item to Cart

```typescript
function addItem(
  product: MenuProduct,
  quantity: number = 1,
  addons?: ProductAddon[],
  notes?: string
): void {
  // Validate quantity (1-99)
  if (quantity < 1 || quantity > 99) {
    throw new Error('Quantity must be between 1 and 99');
  }

  // Check if item with same product and addons exists
  const existingItemIndex = findMatchingItem(product.id, addons);

  if (existingItemIndex !== null) {
    // Item exists, increment quantity
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > 99) {
      throw new Error('Cannot add more than 99 of the same item');
    }

    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // New item, add to cart
    const newItem: CartItem = {
      id: generateUUID(),
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      quantity: quantity,
      addons: addons || [],
      notes: notes,
      subtotal: 0 // Will be calculated
    };

    cart.items.push(newItem);
  }

  // Recalculate totals
  calculateTotals();
}
```

#### Update Item Quantity

```typescript
function updateQuantity(cartItemId: string, quantity: number): void {
  // Validate quantity (0-99)
  if (quantity < 0 || quantity > 99) {
    throw new Error('Quantity must be between 0 and 99');
  }

  // If quantity is 0, remove the item
  if (quantity === 0) {
    removeItem(cartItemId);
    return;
  }

  const itemIndex = cart.items.findIndex(item => item.id === cartItemId);

  if (itemIndex === -1) {
    throw new Error('Cart item not found');
  }

  cart.items[itemIndex].quantity = quantity;

  // Recalculate totals
  calculateTotals();
}
```

#### Remove Item from Cart

```typescript
function removeItem(cartItemId: string): void {
  cart.items = cart.items.filter(item => item.id !== cartItemId);

  // Recalculate totals
  calculateTotals();
}
```

#### Clear Cart

```typescript
function clearCart(): void {
  cart.items = [];
  cart.subtotal = 0;
  cart.tax = 0;
  cart.total = 0;
}
```

---

### 4.3 Cart Calculations

```typescript
function calculateTotals(): void {
  if (cart.items.length === 0) {
    cart.subtotal = 0;
    cart.tax = 0;
    cart.total = 0;
    return;
  }

  // Calculate subtotal
  cart.subtotal = cart.items.reduce((sum, item) => {
    // Calculate item subtotal
    const basePrice = item.price * item.quantity;
    const addonsPrice = item.addons.reduce(
      (addonSum, addon) => addonSum + (addon.price * item.quantity),
      0
    );
    item.subtotal = basePrice + addonsPrice;
    
    return sum + item.subtotal;
  }, 0);

  // Tax is 0% as per requirements
  cart.tax = 0;

  // Calculate total
  cart.total = cart.subtotal + cart.tax;
}
```

### 4.4 Helper Functions

```typescript
// Find matching cart item by product ID and addons
function findMatchingItem(
  productId: string,
  addons?: ProductAddon[]
): number | null {
  for (let i = 0; i < cart.items.length; i++) {
    const item = cart.items[i];

    if (item.productId !== productId) {
      continue;
    }

    // Check if addons match
    if (addonsMatch(item.addons, addons || [])) {
      return i;
    }
  }

  return null;
}

// Check if two addon lists are equivalent
function addonsMatch(
  addons1: ProductAddon[],
  addons2: ProductAddon[]
): boolean {
  if (addons1.length !== addons2.length) {
    return false;
  }

  // Sort by ID for comparison
  const sorted1 = [...addons1].sort((a, b) => a.id.localeCompare(b.id));
  const sorted2 = [...addons2].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i].id !== sorted2[i].id) {
      return false;
    }
  }

  return true;
}

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

---

## 5. Order Submission Flow

### 5.1 Complete Order Submission Process

```typescript
async function submitOrder(
  customer: CustomerInfo,
  cart: Cart,
  orderNote?: string
): Promise<OrderResponse> {
  
  // 1. Validate customer information
  const validationError = validateCustomerInfo(customer);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Validate cart is not empty
  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // 3. Check socket connection
  if (!socket.connected) {
    throw new Error('Connection lost. Please check your internet and try again.');
  }

  // 4. Generate unique request ID
  const requestId = generateUUID();

  // 5. Get customer socket ID
  const customerSocketId = socket.id;

  // 6. Convert cart items to order request items
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

  // 7. Create order request payload
  const orderRequest: OrderRequest = {
    customerSocketId: customerSocketId,
    requestId: requestId,
    publicSeatId: currentSeatId, // From seat connection
    customer: customer,
    items: orderItems,
    orderNote: orderNote,
    subtotal: cart.subtotal,
    tax: cart.tax,
    total: cart.total,
    timestamp: new Date().toISOString()
  };

  // 8. Submit order with timeout
  const response = await emitWithTimeout<OrderResponse>(
    'customer:order:create',
    orderRequest,
    'customer:order:create:response',
    30000 // 30 second timeout
  );

  // 9. Return response
  return response;
}
```

---

### 5.2 Socket.IO Emit with Timeout Pattern

```typescript
function emitWithTimeout<T>(
  eventName: string,
  data: any,
  responseEvent: string,
  timeout: number = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let responseReceived = false;

    // Setup timeout
    timeoutId = setTimeout(() => {
      if (!responseReceived) {
        socket.off(responseEvent);
        socket.off('customer:error');
        socket.off('customer:timeout');
        reject(new Error('Request timed out. Please check your connection and try again.'));
      }
    }, timeout);

    // Listen for success response (one-time)
    socket.once(responseEvent, (response: T) => {
      responseReceived = true;
      clearTimeout(timeoutId);
      socket.off('customer:error');
      socket.off('customer:timeout');
      resolve(response);
    });

    // Listen for error events
    socket.once('customer:error', (error: any) => {
      responseReceived = true;
      clearTimeout(timeoutId);
      socket.off(responseEvent);
      socket.off('customer:timeout');
      reject(new Error(error.message || 'An error occurred. Please try again.'));
    });

    // Listen for timeout events from server
    socket.once('customer:timeout', () => {
      responseReceived = true;
      clearTimeout(timeoutId);
      socket.off(responseEvent);
      socket.off('customer:error');
      reject(new Error('Server is taking too long to respond. Please try again.'));
    });

    // Emit the event
    socket.emit(eventName, data);
  });
}
```

### 5.3 Customer Information Validation

```typescript
function validateCustomerInfo(customer: CustomerInfo): string | null {
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
```

---

### 5.4 Order Status Listening

```typescript
// Start listening for order status updates
function listenForOrderStatusUpdates(
  orderId: string,
  onUpdate: (update: OrderStatusUpdate) => void
): void {
  socket.on('customer:order:status:update', (update: OrderStatusUpdate) => {
    // Filter by orderId
    if (update.orderId === orderId) {
      onUpdate(update);
    }
  });
}

// Stop listening for order status updates
function stopListeningForOrderStatus(): void {
  socket.off('customer:order:status:update');
}
```

---

## 6. UI Components

### 6.1 Cart Screen

**Purpose**: Display cart items with quantity controls and totals

**Key Features**:
- List of cart items with product details
- Quantity increment/decrement buttons
- Remove item button
- Subtotal, tax, and total display
- Proceed to checkout button
- Empty cart state

**User Interactions**:
```typescript
// Increment item quantity
function handleIncrement(cartItemId: string, currentQuantity: number): void {
  updateQuantity(cartItemId, currentQuantity + 1);
}

// Decrement item quantity
function handleDecrement(cartItemId: string, currentQuantity: number): void {
  updateQuantity(cartItemId, currentQuantity - 1);
}

// Remove item
function handleRemove(cartItemId: string): void {
  removeItem(cartItemId);
}

// Navigate to checkout
function handleCheckout(): void {
  if (cart.items.length === 0) {
    showError('Cart is empty');
    return;
  }
  navigateToCheckout();
}
```

---

### 6.2 Checkout Screen

**Purpose**: Collect customer information and submit order

**Key Features**:
- Customer information form (name, phone, delivery type, address)
- Collapsible order summary
- Total display
- Place order button with loading state
- Connection status indicator
- Form validation

**Form State Management**:
```typescript
interface CheckoutFormState {
  customerInfo: CustomerInfo | null;
  isFormValid: boolean;
  isOrderSummaryExpanded: boolean;
  isSubmitting: boolean;
  isConnected: boolean;
}

// Handle form changes
function handleFormChanged(info: CustomerInfo | null, isValid: boolean): void {
  setCustomerInfo(info);
  setIsFormValid(isValid);
}

// Handle place order
async function handlePlaceOrder(): Promise<void> {
  if (!isFormValid || !customerInfo || isSubmitting) {
    return;
  }

  if (cart.items.length === 0) {
    showError('Cart is empty');
    return;
  }

  // Check connection
  if (!socket.connected) {
    setIsConnected(false);
    showError('Connection lost. Please reconnect and try again.');
    return;
  }

  setIsSubmitting(true);
  setIsConnected(true);

  try {
    // Submit order
    const response = await submitOrder(customerInfo, cart);

    if (response.success && response.order) {
      // Show success dialog
      await showSuccessDialog(response.order);

      // Clear cart
      clearCart();

      // Navigate back
      navigateBack();
    } else {
      // Handle error response
      const errorMessage = getErrorMessage(response.error?.code);
      showError(errorMessage);
    }
  } catch (error) {
    // Handle timeout or connection errors
    const isConnectionError = 
      error.message.includes('Connection lost') ||
      error.message.includes('connection');

    if (isConnectionError) {
      setIsConnected(false);
    }

    const errorMessage = isConnectionError
      ? 'Connection lost during order submission'
      : 'Order submission failed. Please try again.';
    
    showError(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
}
```

---

### 6.3 Order Success Dialog

**Purpose**: Display order confirmation details

**Key Features**:
- Order receipt number
- Order status
- Estimated preparation time
- Order total
- Order items list
- Success message

**Display Logic**:
```typescript
function showSuccessDialog(orderData: OrderData): Promise<void> {
  return new Promise((resolve) => {
    // Display modal/dialog with order details
    const dialog = {
      title: 'Order Placed Successfully!',
      receiptNumber: orderData.receiptNumber,
      status: formatOrderStatus(orderData.status),
      estimatedTime: orderData.estimatedTime 
        ? `${orderData.estimatedTime} minutes` 
        : 'To be confirmed',
      total: `$${orderData.total.toFixed(2)}`,
      items: orderData.items || [],
      onClose: () => resolve()
    };

    showModal(dialog);
  });
}

function formatOrderStatus(status: OrderStatus): string {
  const statusMap = {
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

---

## 7. Error Handling

### 7.1 Error Types and Messages

```typescript
interface ErrorMessages {
  // Connection errors
  CONNECTION_LOST: 'Connection lost. Please check your internet and try again.';
  CONNECTION_TIMEOUT: 'Request timed out. Please check your connection and try again.';
  
  // Validation errors
  EMPTY_CART: 'Cart is empty. Please add items before checkout.';
  INVALID_CUSTOMER_INFO: 'Please provide valid customer information.';
  INVALID_QUANTITY: 'Quantity must be between 1 and 99.';
  
  // Order errors
  PRODUCT_UNAVAILABLE: 'One or more products are currently unavailable.';
  INSUFFICIENT_STOCK: 'Insufficient stock for requested quantity.';
  ORDER_PROCESSING_FAILED: 'Order processing failed. Please try again.';
  ORDER_TIMEOUT: 'Order request timed out. Please try again.';
  
  // Generic error
  GENERIC_ERROR: 'An error occurred. Please try again.';
}

function getErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'PRODUCT_UNAVAILABLE':
      return ErrorMessages.PRODUCT_UNAVAILABLE;
    case 'INSUFFICIENT_STOCK':
      return ErrorMessages.INSUFFICIENT_STOCK;
    case 'INVALID_CUSTOMER_INFO':
      return ErrorMessages.INVALID_CUSTOMER_INFO;
    default:
      return ErrorMessages.ORDER_PROCESSING_FAILED;
  }
}
```

---

### 7.2 Error Handling Best Practices

1. **Always validate before submission**
   - Check cart is not empty
   - Validate customer information
   - Verify socket connection

2. **Handle timeouts gracefully**
   - Use 30-second timeout for order submission
   - Show clear timeout messages
   - Allow user to retry

3. **Provide user-friendly error messages**
   - Avoid technical jargon
   - Suggest actionable solutions
   - Use consistent error formatting

4. **Handle connection loss**
   - Monitor socket connection status
   - Show connection indicator in UI
   - Prevent submission when disconnected

5. **Log errors for debugging**
   - Log all errors with context
   - Include request IDs for correlation
   - Track error patterns

---

## 8. Website Implementation Steps

### 8.1 Prerequisites

**Required Libraries**:
- Socket.IO Client: `socket.io-client` (v4.x)
- UUID Generator: `uuid`
- State Management: React Context/Redux/Zustand (your choice)

**Installation**:
```bash
npm install socket.io-client uuid
# or
yarn add socket.io-client uuid
```

---

### 8.2 Socket.IO Setup

```typescript
// socket-service.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  // Initialize and connect
  connect(clientType: string = 'customer'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        query: {
          clientType: clientType
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    });
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketService;
```

---

### 8.3 Cart Management Implementation

```typescript
// cart-store.ts (using Zustand as example)
import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface CartStore {
  cart: Cart;
  addItem: (product: MenuProduct, quantity?: number, addons?: ProductAddon[], notes?: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

const useCartStore = create<CartStore>((set, get) => ({
  cart: {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    isEmpty: true,
    itemCount: 0
  },

  addItem: (product, quantity = 1, addons = [], notes) => {
    const { cart } = get();
    
    // Validate quantity
    if (quantity < 1 || quantity > 99) {
      throw new Error('Quantity must be between 1 and 99');
    }

    // Check if item exists
    const existingItemIndex = findMatchingItem(cart.items, product.id, addons);

    let updatedItems: CartItem[];

    if (existingItemIndex !== null) {
      // Update existing item
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
      // Add new item
      const newItem: CartItem = {
        id: uuidv4(),
        productId: product.id,
        name: product.name,
        price: product.finalPrice,
        quantity: quantity,
        addons: addons,
        notes: notes,
        subtotal: 0
      };

      updatedItems = [...cart.items, newItem];
    }

    // Calculate totals and update state
    const updatedCart = calculateTotals(updatedItems);
    set({ cart: updatedCart });
  },

  updateQuantity: (cartItemId, quantity) => {
    const { cart } = get();

    if (quantity < 0 || quantity > 99) {
      throw new Error('Quantity must be between 0 and 99');
    }

    if (quantity === 0) {
      get().removeItem(cartItemId);
      return;
    }

    const updatedItems = cart.items.map(item =>
      item.id === cartItemId ? { ...item, quantity } : item
    );

    const updatedCart = calculateTotals(updatedItems);
    set({ cart: updatedCart });
  },

  removeItem: (cartItemId) => {
    const { cart } = get();
    const updatedItems = cart.items.filter(item => item.id !== cartItemId);
    const updatedCart = calculateTotals(updatedItems);
    set({ cart: updatedCart });
  },

  clearCart: () => {
    set({
      cart: {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        isEmpty: true,
        itemCount: 0
      }
    });
  }
}));

// Helper functions
function calculateTotals(items: CartItem[]): Cart {
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

  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.price * item.quantity;
    const addonsPrice = item.addons.reduce(
      (addonSum, addon) => addonSum + (addon.price * item.quantity),
      0
    );
    item.subtotal = basePrice + addonsPrice;
    return sum + item.subtotal;
  }, 0);

  const tax = 0; // 0% tax as per requirements
  const total = subtotal + tax;
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

function findMatchingItem(
  items: CartItem[],
  productId: string,
  addons: ProductAddon[]
): number | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.productId === productId && addonsMatch(item.addons, addons)) {
      return i;
    }
  }
  return null;
}

function addonsMatch(addons1: ProductAddon[], addons2: ProductAddon[]): boolean {
  if (addons1.length !== addons2.length) return false;
  
  const sorted1 = [...addons1].sort((a, b) => a.id.localeCompare(b.id));
  const sorted2 = [...addons2].sort((a, b) => a.id.localeCompare(b.id));
  
  return sorted1.every((addon, i) => addon.id === sorted2[i].id);
}

export default useCartStore;
```

---

### 8.4 Order Service Implementation

```typescript
// order-service.ts
import { v4 as uuidv4 } from 'uuid';
import SocketService from './socket-service';

class OrderService {
  private socketService: SocketService;
  private currentSeatId: string | null = null;

  constructor(socketService: SocketService) {
    this.socketService = socketService;
  }

  // Set current seat ID
  setCurrentSeatId(seatId: string): void {
    this.currentSeatId = seatId;
  }

  // Submit order
  async submitOrder(
    customer: CustomerInfo,
    cart: Cart,
    orderNote?: string
  ): Promise<OrderResponse> {
    // Validate
    const validationError = this.validateCustomerInfo(customer);
    if (validationError) {
      throw new Error(validationError);
    }

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const socket = this.socketService.getSocket();
    if (!socket || !socket.connected) {
      throw new Error('Connection lost. Please check your internet and try again.');
    }

    if (!this.currentSeatId) {
      throw new Error('No seat connected');
    }

    // Generate request ID
    const requestId = uuidv4();
    const customerSocketId = socket.id || '';

    // Convert cart items
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

    // Create order request
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

    // Submit with timeout
    return this.emitWithTimeout<OrderResponse>(
      'customer:order:create',
      orderRequest,
      'customer:order:create:response',
      30000
    );
  }

  // Listen for order status updates
  listenForOrderStatusUpdates(
    orderId: string,
    onUpdate: (update: OrderStatusUpdate) => void
  ): void {
    const socket = this.socketService.getSocket();
    if (!socket) return;

    socket.on('customer:order:status:update', (update: OrderStatusUpdate) => {
      if (update.orderId === orderId) {
        onUpdate(update);
      }
    });
  }

  // Stop listening for order status updates
  stopListeningForOrderStatus(): void {
    const socket = this.socketService.getSocket();
    if (!socket) return;

    socket.off('customer:order:status:update');
  }

  // Emit with timeout helper
  private emitWithTimeout<T>(
    eventName: string,
    data: any,
    responseEvent: string,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const socket = this.socketService.getSocket();
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      let timeoutId: NodeJS.Timeout;
      let responseReceived = false;

      // Setup timeout
      timeoutId = setTimeout(() => {
        if (!responseReceived) {
          socket.off(responseEvent);
          socket.off('customer:error');
          socket.off('customer:timeout');
          reject(new Error('Request timed out. Please check your connection and try again.'));
        }
      }, timeout);

      // Listen for success response
      socket.once(responseEvent, (response: T) => {
        responseReceived = true;
        clearTimeout(timeoutId);
        socket.off('customer:error');
        socket.off('customer:timeout');
        resolve(response);
      });

      // Listen for error events
      socket.once('customer:error', (error: any) => {
        responseReceived = true;
        clearTimeout(timeoutId);
        socket.off(responseEvent);
        socket.off('customer:timeout');
        reject(new Error(error.message || 'An error occurred. Please try again.'));
      });

      // Listen for timeout events
      socket.once('customer:timeout', () => {
        responseReceived = true;
        clearTimeout(timeoutId);
        socket.off(responseEvent);
        socket.off('customer:error');
        reject(new Error('Server is taking too long to respond. Please try again.'));
      });

      // Emit the event
      socket.emit(eventName, data);
    });
  }

  // Validate customer info
  private validateCustomerInfo(customer: CustomerInfo): string | null {
    const trimmedName = customer.name.trim();
    if (trimmedName.length === 0) return 'Name is required';
    if (trimmedName.length < 2) return 'Name must be at least 2 characters';
    if (trimmedName.length > 100) return 'Name must not exceed 100 characters';

    if (customer.phone.trim().length === 0) return 'Phone number is required';

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

export default OrderService;
```

---

### 8.5 React Component Examples

#### Cart Component

```tsx
// CartScreen.tsx
import React from 'react';
import useCartStore from '../stores/cart-store';
import CartItem from './CartItem';

const CartScreen: React.FC = () => {
  const { cart, updateQuantity, removeItem } = useCartStore();

  if (cart.isEmpty) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add items to get started</p>
        <button onClick={() => window.history.back()}>Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="cart-screen">
      <header>
        <h1>Cart</h1>
        <button onClick={() => window.history.back()}>Close</button>
      </header>

      <div className="cart-items">
        {cart.items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>${cart.tax.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>${cart.total.toFixed(2)}</span>
        </div>
        <button 
          className="checkout-button"
          onClick={() => window.location.href = '/checkout'}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartScreen;
```

---

#### Checkout Component

```tsx
// CheckoutScreen.tsx
import React, { useState } from 'react';
import useCartStore from '../stores/cart-store';
import OrderService from '../services/order-service';
import CustomerInfoForm from './CustomerInfoForm';
import OrderSuccessModal from './OrderSuccessModal';

interface CheckoutScreenProps {
  orderService: OrderService;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ orderService }) => {
  const { cart, clearCart } = useCartStore();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setIsSubmitting(true);
    setIsConnected(true);
    setError(null);

    try {
      const response = await orderService.submitOrder(customerInfo, cart);

      if (response.success && response.order) {
        setOrderData(response.order);
        setShowSuccess(true);
        clearCart();
      } else {
        const errorMessage = getErrorMessage(response.error?.code);
        setError(errorMessage);
      }
    } catch (err: any) {
      const isConnectionError = 
        err.message.includes('Connection lost') ||
        err.message.includes('connection');

      if (isConnectionError) {
        setIsConnected(false);
      }

      const errorMessage = isConnectionError
        ? 'Connection lost during order submission'
        : 'Order submission failed. Please try again.';
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = (errorCode?: string): string => {
    switch (errorCode) {
      case 'PRODUCT_UNAVAILABLE':
        return 'One or more products are currently unavailable';
      case 'INSUFFICIENT_STOCK':
        return 'Insufficient stock for requested quantity';
      case 'INVALID_CUSTOMER_INFO':
        return 'Invalid customer information';
      default:
        return 'Order submission failed. Please try again.';
    }
  };

  if (cart.isEmpty) {
    window.history.back();
    return null;
  }

  return (
    <div className="checkout-screen">
      <header>
        <h1>Checkout</h1>
      </header>

      <div className="checkout-content">
        <section className="customer-info-section">
          <h2>Customer Information</h2>
          <CustomerInfoForm onChanged={handleFormChanged} />
        </section>

        <section className="order-summary-section">
          <h2>Order Summary</h2>
          <div className="order-items">
            {cart.items.map(item => (
              <div key={item.id} className="order-item">
                <span className="quantity">{item.quantity}x</span>
                <span className="name">{item.name}</span>
                <span className="price">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="checkout-footer">
        {!isConnected && (
          <div className="connection-warning">
            <span>⚠️ Connection lost. Please check your internet.</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        <div className="total-row">
          <span>Total</span>
          <span>${cart.total.toFixed(2)}</span>
        </div>

        <button
          className="place-order-button"
          onClick={handlePlaceOrder}
          disabled={!isFormValid || isSubmitting || !isConnected}
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>

      {showSuccess && orderData && (
        <OrderSuccessModal
          orderData={orderData}
          onClose={() => {
            setShowSuccess(false);
            window.history.back();
          }}
        />
      )}
    </div>
  );
};

export default CheckoutScreen;
```

---

### 8.6 Complete Integration Example

```typescript
// app.ts - Main application setup
import SocketService from './services/socket-service';
import OrderService from './services/order-service';

// Configuration
const SOCKET_SERVER_URL = 'https://your-pos-server.com';

// Initialize services
const socketService = new SocketService(SOCKET_SERVER_URL);
const orderService = new OrderService(socketService);

// Connect to socket
async function initializeApp() {
  try {
    // Connect socket with customer client type
    await socketService.connect('customer');
    console.log('Socket connected successfully');

    // Connect to a specific seat (e.g., from QR code scan)
    const publicSeatId = 'SEAT-001'; // Get from QR code or URL parameter
    await connectToSeat(publicSeatId);

  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error to user
  }
}

// Connect to seat
async function connectToSeat(publicSeatId: string) {
  const socket = socketService.getSocket();
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('customer:connect:success');
      reject(new Error('Connection timeout'));
    }, 10000);

    socket.once('customer:connect:success', (response: any) => {
      clearTimeout(timeout);
      
      if (response.success && response.seat) {
        orderService.setCurrentSeatId(publicSeatId);
        console.log('Connected to seat:', response.seat);
        resolve(response);
      } else {
        reject(new Error(response.error || 'Failed to connect to seat'));
      }
    });

    // Emit connection request
    socket.emit('customer:connect', {
      publicSeatId: publicSeatId,
      deviceId: getDeviceId(),
      platform: 'web'
    });
  });
}

// Get or generate device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize app on load
initializeApp();

// Export services for use in components
export { socketService, orderService };
```

---

## 9. Testing Checklist

### 9.1 Cart Functionality
- [ ] Add item to empty cart
- [ ] Add same item (should increment quantity)
- [ ] Add item with different addons (should create new cart item)
- [ ] Update item quantity (increment/decrement)
- [ ] Remove item from cart
- [ ] Clear entire cart
- [ ] Validate quantity limits (1-99)
- [ ] Calculate totals correctly (subtotal, tax, total)

### 9.2 Order Submission
- [ ] Submit order with valid data
- [ ] Handle successful order response
- [ ] Handle error responses (product unavailable, insufficient stock, etc.)
- [ ] Handle timeout (30 seconds)
- [ ] Handle connection loss during submission
- [ ] Validate customer information before submission
- [ ] Prevent submission with empty cart
- [ ] Prevent duplicate submissions (disable button while submitting)

### 9.3 Socket.IO Communication
- [ ] Connect to socket successfully
- [ ] Connect to seat successfully
- [ ] Emit order create event
- [ ] Receive order create response
- [ ] Listen for order status updates
- [ ] Handle socket disconnection
- [ ] Handle socket reconnection
- [ ] Handle timeout events from server
- [ ] Handle error events from server

### 9.4 UI/UX
- [ ] Display cart items correctly
- [ ] Show loading state during submission
- [ ] Show connection status indicator
- [ ] Display error messages clearly
- [ ] Show success dialog with order details
- [ ] Navigate back after successful order
- [ ] Clear cart after successful order
- [ ] Disable submit button when form invalid
- [ ] Disable submit button when disconnected

---

## 10. Common Issues and Solutions

### Issue 1: Order submission timeout

**Symptoms**: Order request times out after 30 seconds

**Possible Causes**:
- Server is overloaded
- Network connection is slow
- Server is not responding to the event

**Solutions**:
1. Check server logs for errors
2. Verify server is listening to `customer:order:create` event
3. Check network connection quality
4. Increase timeout if necessary (not recommended)

---

### Issue 2: Cart totals incorrect

**Symptoms**: Subtotal or total doesn't match expected value

**Possible Causes**:
- Addon prices not included in calculation
- Quantity not multiplied correctly
- Floating point precision errors

**Solutions**:
1. Verify calculation logic includes addon prices
2. Ensure quantity is multiplied for both base price and addons
3. Use `toFixed(2)` for display, but keep full precision in calculations

---

### Issue 3: Socket connection lost during order

**Symptoms**: Order fails with connection error

**Possible Causes**:
- Network interruption
- Server restart
- Socket timeout

**Solutions**:
1. Implement connection status monitoring
2. Show connection indicator in UI
3. Prevent submission when disconnected
4. Implement automatic reconnection
5. Allow user to retry after reconnection

---

### Issue 4: Duplicate cart items

**Symptoms**: Same product appears multiple times in cart

**Possible Causes**:
- Addon matching logic not working correctly
- Item comparison not considering all fields

**Solutions**:
1. Verify addon matching logic sorts addons before comparison
2. Ensure comparison checks all addon IDs
3. Test with various addon combinations

---

### Issue 5: Order response not received

**Symptoms**: No response after emitting order create event

**Possible Causes**:
- Server not emitting response event
- Event name mismatch
- Socket disconnected before response

**Solutions**:
1. Verify server emits `customer:order:create:response`
2. Check event names match exactly (case-sensitive)
3. Verify socket is still connected when response arrives
4. Check server logs for errors

---

## 11. Performance Optimization

### 11.1 Cart State Management

**Optimization**: Use memoization for cart calculations

```typescript
import { useMemo } from 'react';

function useCartTotals(cart: Cart) {
  return useMemo(() => ({
    subtotal: cart.subtotal,
    tax: cart.tax,
    total: cart.total,
    itemCount: cart.itemCount
  }), [cart.items]); // Only recalculate when items change
}
```

### 11.2 Socket Event Listeners

**Optimization**: Clean up event listeners properly

```typescript
useEffect(() => {
  const socket = socketService.getSocket();
  if (!socket) return;

  const handleStatusUpdate = (update: OrderStatusUpdate) => {
    // Handle update
  };

  socket.on('customer:order:status:update', handleStatusUpdate);

  // Cleanup on unmount
  return () => {
    socket.off('customer:order:status:update', handleStatusUpdate);
  };
}, []);
```

### 11.3 Debounce Quantity Updates

**Optimization**: Debounce rapid quantity changes

```typescript
import { debounce } from 'lodash';

const debouncedUpdateQuantity = debounce((itemId: string, quantity: number) => {
  updateQuantity(itemId, quantity);
}, 300);
```

---

## 12. Security Considerations

### 12.1 Input Validation

**Always validate**:
- Customer name (2-100 characters)
- Phone number (not empty)
- Delivery address (10+ characters if delivery type)
- Quantity (1-99)
- Product IDs (valid format)

### 12.2 Socket.IO Security

**Best practices**:
- Use HTTPS/WSS for socket connections
- Implement authentication tokens if required
- Validate all incoming data from server
- Don't trust client-side data on server

### 12.3 Data Sanitization

**Sanitize user inputs**:
```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
```

---

## 13. Monitoring and Logging

### 13.1 Log Important Events

```typescript
// Log order submission
console.log('Order submitted:', {
  requestId: orderRequest.requestId,
  itemCount: orderRequest.items.length,
  total: orderRequest.total,
  timestamp: orderRequest.timestamp
});

// Log order response
console.log('Order response received:', {
  requestId: response.requestId,
  success: response.success,
  orderId: response.order?.id,
  receiptNumber: response.order?.receiptNumber
});

// Log errors
console.error('Order submission failed:', {
  requestId: orderRequest.requestId,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

### 13.2 Track Metrics

**Key metrics to track**:
- Order submission success rate
- Average order submission time
- Timeout rate
- Connection loss rate
- Error types and frequency

---

## 14. Summary

This guide provides a complete specification for implementing order creation functionality in a website application, matching the behavior of the Flutter mobile app.

**Key Points**:
1. Use Socket.IO for real-time communication
2. Implement proper timeout handling (30s for orders)
3. Validate all inputs before submission
4. Handle connection loss gracefully
5. Provide clear user feedback
6. Clean up event listeners properly
7. Test all error scenarios

**Next Steps**:
1. Set up Socket.IO client
2. Implement cart state management
3. Create order service with timeout handling
4. Build UI components (cart, checkout)
5. Test thoroughly with various scenarios
6. Monitor and optimize performance

For questions or issues, refer to the Flutter implementation in:
- `lib/features/customer_ordering/cubit/cart_cubit.dart`
- `lib/features/customer_seat/services/seat_connection_service.dart`
- `lib/features/customer_ordering/screens/checkout_screen.dart`

---

**Document Version**: 1.0  
**Last Updated**: May 7, 2026  
**Author**: Development Team
