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
