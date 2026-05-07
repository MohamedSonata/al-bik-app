import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '@/services/socket.service';
import { products as staticProducts } from '@/data/products';
import { categories as staticCategories } from '@/data/categories';
import type { ConnectionStatus, MenuCategory, MenuProduct } from '@/types/seat.types';
import type { Category } from '@/data/categories';
import type { Product } from '@/data/products';

/* ── Mapping helpers ─────────────────────────────────────── */

function mapCategory(raw: MenuCategory): Category {
  return {
    slug: raw.id,
    labelAr: raw.name,
    labelEn: raw.name,
    icon: '',
  };
}

function mapProduct(raw: MenuProduct, categoryId: string): Product {
  return {
    id: raw.id,
    nameAr: raw.name,
    nameEn: raw.name,
    descriptionAr: raw.description ?? '',
    descriptionEn: raw.description ?? '',
    price: raw.price,
    category: categoryId,
    imageUrl: raw.imageUrl ?? '',
    ingredients: [],
    featured: false,
    stock: raw.stock,
    discountPercentage: raw.discountPercentage,
    discountedPrice: raw.discountedPrice,
  };
}

/* ── Context shape ───────────────────────────────────────── */

interface MenuDataContextValue {
  status: ConnectionStatus;
  /** All categories (live or static fallback with an "all" prepended) */
  categories: Category[];
  /** Products for the currently selected category (or all if 'all') */
  products: Product[];
  productsLoading: boolean;
  /** Call this when the user picks a category */
  selectCategory: (slug: string) => void;
  activeCategory: string;
  error: string | null;
  /** Whether data is coming from the live socket vs static fallback */
  isLive: boolean;
  /** Retry connection */
  retry: () => void;
  /** Initial loading state */
  initialLoading: boolean;
}

const MenuDataContext = createContext<MenuDataContextValue | null>(null);

/* ── Provider ────────────────────────────────────────────── */

export function MenuDataProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState(staticCategories[0]?.slug ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  /* Cache: categoryId → Product[] so we don't re-fetch */
  const productCache = useRef(new Map<string, Product[]>());
  /* Flag: is live data being used? */
  const isLive = status === 'connected' && liveCategories.length > 0;

  /* Exposed categories: live or static fallback */
  const categories: Category[] = isLive ? liveCategories : staticCategories;

  /* ── Live products loader ──────────────────────────────── */
  const fetchLiveProducts = useCallback(async (slug: string) => {
    if (!isLive) return;

    /* Check cache first */
    if (productCache.current.has(slug)) {
      setProducts(productCache.current.get(slug)!);
      return;
    }

    /* Fetch from server */
    setProductsLoading(true);
    try {
      const response = await socketService.requestProducts(slug);
      const mapped = response.products.map((p) => mapProduct(p, slug));
      productCache.current.set(slug, mapped);
      setProducts(mapped.length > 0 ? mapped : staticProducts.filter((p) => p.category === slug));
    } catch {
      setProducts(staticProducts.filter((p) => p.category === slug));
    } finally {
      setProductsLoading(false);
    }
  }, [isLive]);

  /* ── Category selection handler ────────────────────────── */
  const selectCategory = useCallback(
    (slug: string) => {
      setActiveCategory(slug);
      if (isLive) {
        fetchLiveProducts(slug);
      } else {
        /* Static filter */
        setProducts(staticProducts.filter((p) => p.category === slug));
      }
    },
    [isLive, fetchLiveProducts],
  );

  /* ── Socket connection lifecycle ───────────────────────── */
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    async function init() {
      setStatus('connecting');
      setError(null);
      setInitialLoading(true);

      /* 60-second timeout */
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout after 60 seconds'));
        }, 60000);
      });

      try {
        /* Race between connection and timeout */
        await Promise.race([
          (async () => {
            /* Phase 1 — connect socket */
            socketService.connect();

            /* Phase 2 — authenticate with seat */
            await socketService.connectToSeat();
            if (cancelled) return;

            /* Phase 3 — fetch categories */
            const catResponse = await socketService.requestCategories();
            if (cancelled) return;

            const mapped = catResponse.categories
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map(mapCategory);

            setLiveCategories(mapped);
            setStatus('connected');
            
            /* Set active category to first real category */
            if (mapped.length > 0) {
              setActiveCategory(mapped[0].slug);
            }

            /* Phase 4 — pre-fetch products for first real category only */
            if (mapped.length > 0) {
              const firstId = mapped[0].slug;
              try {
                const prodResponse = await socketService.requestProducts(firstId);
                if (cancelled) return;
                const prods = prodResponse.products.map((p) => mapProduct(p, firstId));
                productCache.current.set(firstId, prods);
                /* Set initial products to first category */
                setProducts(prods);
              } catch {
                /* Non-fatal — still show categories */
                setProducts(staticProducts.filter((p) => p.category === firstId));
              }
            }
          })(),
          timeoutPromise,
        ]);

        clearTimeout(timeoutId);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Socket connection failed';
        console.warn('[MenuData] Error:', msg);
        setError(msg);
        setStatus('error');
        clearTimeout(timeoutId);
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  /* ── Retry handler ─────────────────────────────────────── */
  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    productCache.current.clear();
  }, []);

  return (
    <MenuDataContext.Provider
      value={{
        status,
        categories,
        products,
        productsLoading,
        selectCategory,
        activeCategory,
        error,
        isLive,
        retry,
        initialLoading,
      }}
    >
      {children}
    </MenuDataContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────── */

export function useMenuData() {
  const ctx = useContext(MenuDataContext);
  if (!ctx) throw new Error('useMenuData must be used inside <MenuDataProvider>');
  return ctx;
}
