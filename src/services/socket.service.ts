import { io, Socket } from 'socket.io-client';
import type {
  SeatConnectionResponse,
  MenuCategoriesResponse,
  MenuProductsResponse,
} from '@/types/seat.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;
const PUBLIC_SEAT_ID = 'RESTINTRJ';
const TIMEOUT_MS = 10_000;

// Debug: Log the socket URL on initialization
console.log('[SocketService] VITE_SOCKET_URL:', SOCKET_URL);

class SocketService {
  private socket: Socket | null = null;

  /** Connect to the backend as a customer (no auth) */
  connect(): Socket {
    if (this.socket?.connected) {
      console.log('[SocketService] Socket already connected');
      return this.socket;
    }

    if (!SOCKET_URL) {
      throw new Error('VITE_SOCKET_URL is not configured');
    }

    console.log('[SocketService] Creating new socket connection to:', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      query: { clientType: 'Website' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 4,
      timeout: 8000,
    });

    this.socket.on('connect', () => {
      console.info('[Socket] Connected — socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
    });

    this.socket.on('customer:error', (err) => {
      console.error('[Socket] Server error:', err);
    });

    return this.socket;
  }

  /** Wait for socket to be connected */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not initialized'));
      }

      if (this.socket.connected) {
        console.log('[SocketService] Socket already connected');
        return resolve();
      }

      console.log('[SocketService] Waiting for socket connection...');
      const timer = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, TIMEOUT_MS);

      this.socket.once('connect', () => {
        console.log('[SocketService] Socket connected successfully');
        clearTimeout(timer);
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        console.error('[SocketService] Socket connection error:', error);
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /** Authenticate with the static seat ID */
  async connectToSeat(): Promise<SeatConnectionResponse> {
    // Wait for socket to be connected first
    await this.waitForConnection();

    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialised'));

      const timer = setTimeout(
        () => reject(new Error('Seat connection timed out')),
        TIMEOUT_MS,
      );

      console.log('[SocketService] Emitting customer:connect with publicSeatId:', PUBLIC_SEAT_ID);
      this.socket.emit('customer:connect', { publicSeatId: PUBLIC_SEAT_ID });

      this.socket.once('customer:connect:success', (response: any) => {
        console.log('[SocketService] Received customer:connect:success:', response);
        clearTimeout(timer);
        if (response.success) {
          // Server doesn't return publicSeatId in response, so we use the one we sent
          const responseWithSeatId: SeatConnectionResponse = {
            success: true,
            seat: {
              publicSeatId: PUBLIC_SEAT_ID,
              businessName: response.businessName || '',
              businessType: response.businessType || '',
              features: response.features || {
                allowMenuBrowsing: true,
                allowBarcodeScanning: true,
                allowCustomerOrdering: true,
              }
            }
          };
          console.log('[SocketService] Seat connection successful, publicSeatId:', PUBLIC_SEAT_ID);
          resolve(responseWithSeatId);
        } else {
          console.error('[SocketService] Seat connection rejected:', response.error);
          reject(new Error(response.error ?? 'Seat connection rejected'));
        }
      });

      this.socket.once('customer:error', (error: any) => {
        console.error('[SocketService] Received customer:error during seat connection:', error);
        clearTimeout(timer);
        reject(new Error(error.message || 'Seat connection failed'));
      });
    });
  }

  /** Fetch menu categories */
  requestCategories(): Promise<MenuCategoriesResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialised'));

      const timer = setTimeout(() => reject(new Error('Categories request timed out')), TIMEOUT_MS);

      this.socket.emit('customer:menu:categories', {});

      this.socket.once('customer:menu:categories:data', (response: MenuCategoriesResponse) => {
        clearTimeout(timer);
        if (response.success) resolve(response);
        else reject(new Error('Failed to fetch categories'));
      });

      this.socket.once('customer:timeout', () => {
        clearTimeout(timer);
        reject(new Error('Server timed out the categories request'));
      });
    });
  }

  /** Fetch products for a specific category */
  requestProducts(categoryId: string): Promise<MenuProductsResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialised'));

      const timer = setTimeout(() => reject(new Error('Products request timed out')), TIMEOUT_MS);

      this.socket.emit('customer:menu:products', { categoryId });

      this.socket.once('customer:menu:products:data', (response: MenuProductsResponse) => {
        clearTimeout(timer);
        if (response.success) resolve(response);
        else reject(new Error('Failed to fetch products'));
      });

      this.socket.once('customer:timeout', () => {
        clearTimeout(timer);
        reject(new Error('Server timed out the products request'));
      });
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
