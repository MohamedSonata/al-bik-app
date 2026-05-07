import { io, Socket } from 'socket.io-client';
import type {
  SeatConnectionResponse,
  MenuCategoriesResponse,
  MenuProductsResponse,
} from '@/types/seat.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;
const PUBLIC_SEAT_ID = 'RESTINTRJ';
const TIMEOUT_MS = 10_000;

class SocketService {
  private socket: Socket | null = null;

  /** Connect to the backend as a customer (no auth) */
  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    if (!SOCKET_URL) {
      throw new Error('VITE_SOCKET_URL is not configured');
    }

    this.socket = io(SOCKET_URL, {
      query: { clientType: 'Website' },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 4,
      timeout: 8000,
    });

    this.socket.on('connect', () => {
      console.info('[Socket] Connected — seat', PUBLIC_SEAT_ID);
    });

    this.socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
    });

    this.socket.on('customer:error', (err) => {
      console.error('[Socket] Server error:', err);
    });

    return this.socket;
  }

  /** Authenticate with the static seat ID */
  connectToSeat(): Promise<SeatConnectionResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialised'));

      const timer = setTimeout(
        () => reject(new Error('Seat connection timed out')),
        TIMEOUT_MS,
      );

      this.socket.emit('customer:connect', { publicSeatId: PUBLIC_SEAT_ID });

      this.socket.once('customer:connect:success', (response: SeatConnectionResponse) => {
        clearTimeout(timer);
        if (response.success) resolve(response);
        else reject(new Error(response.error ?? 'Seat connection rejected'));
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
