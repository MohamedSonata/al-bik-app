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
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to order response
   * @throws Error if validation fails or submission fails
   */
  async submitOrder(
    customer: CustomerInfo,
    cart: Cart,
    orderNote?: string,
    onProgress?: (stage: 'validating' | 'submitting' | 'waiting') => void
  ): Promise<OrderResponse> {
    onProgress?.('validating');
    
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
      console.error('[OrderService] Socket not connected:', {
        hasSocket: !!this.socket,
        isConnected: this.socket?.connected
      });
      throw new Error('Connection lost. Please check your internet and try again.');
    }

    // Check seat ID is set
    if (!this.currentSeatId) {
      console.error('[OrderService] No seat ID set. Socket:', {
        socketId: this.socket.id,
        connected: this.socket.connected,
        currentSeatId: this.currentSeatId
      });
      throw new Error('No seat connected');
    }

    onProgress?.('submitting');

    console.log('[OrderService] Submitting order:', {
      seatId: this.currentSeatId,
      socketId: this.socket.id,
      itemCount: cart.items.length,
      total: cart.total
    });

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

    onProgress?.('waiting');

    // Submit order with 2 minute timeout (120 seconds)
    return this.emitWithTimeout<OrderResponse>(
      'customer:order:create',
      orderRequest,
      'customer:order:create:response',
      120000, // 2 minutes
      onProgress
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
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to response data
   * @throws Error if timeout or error occurs
   */
  private emitWithTimeout<T>(
    eventName: string,
    data: any,
    responseEvent: string,
    timeout: number,
    onProgress?: (stage: 'validating' | 'submitting' | 'waiting') => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      let timeoutId: NodeJS.Timeout;
      let responseReceived = false;

      // Monitor connection loss during submission
      const handleDisconnect = () => {
        if (!responseReceived) {
          cleanup();
          reject(new Error('Connection lost during order submission. Please check your internet and try again.'));
        }
      };

      // Cleanup function
      const cleanup = () => {
        clearTimeout(timeoutId);
        this.socket?.off(responseEvent);
        this.socket?.off('customer:error');
        this.socket?.off('customer:timeout');
        this.socket?.off('disconnect', handleDisconnect);
      };

      // Setup timeout
      timeoutId = setTimeout(() => {
        if (!responseReceived) {
          cleanup();
          reject(new Error('Order submission timed out after 2 minutes. The restaurant may be busy. Please try again or contact support.'));
        }
      }, timeout);

      // Monitor disconnection
      this.socket.on('disconnect', handleDisconnect);

      // Listen for success response (one-time)
      this.socket.once(responseEvent, (response: T) => {
        responseReceived = true;
        cleanup();
        console.log('[OrderService] Received response:', response);
        resolve(response);
      });

      // Listen for error events
      this.socket.once('customer:error', (error: any) => {
        responseReceived = true;
        cleanup();
        console.error('[OrderService] Received error:', error);
        reject(new Error(error.message || 'An error occurred while processing your order. Please try again.'));
      });

      // Listen for timeout events from server
      this.socket.once('customer:timeout', () => {
        responseReceived = true;
        cleanup();
        reject(new Error('Server is taking too long to respond. Please try again or contact support.'));
      });

      // Emit the event
      console.log('[OrderService] Emitting event:', eventName);
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
