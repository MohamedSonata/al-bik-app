export interface SeatConnectionResponse {
  success: boolean;
  seat?: {
    publicSeatId: string;
    businessName: string;
    businessType: string;
    features: {
      allowMenuBrowsing: boolean;
      allowBarcodeScanning: boolean;
      allowCustomerOrdering: boolean;
    };
  };
  error?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface MenuProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  stock?: number;
  discountPercentage?: number;
  discountedPrice?: number;
}

export interface MenuCategoriesResponse {
  success: boolean;
  requestId: string;
  categories: MenuCategory[];
}

export interface MenuProductsResponse {
  success: boolean;
  requestId: string;
  categoryId: string;
  products: MenuProduct[];
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'fallback';
