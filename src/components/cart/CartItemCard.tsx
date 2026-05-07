import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CartItem } from '@/types/order.types';
import { cn } from '@/lib/utils';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < 99) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1 truncate">
            {item.name}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-2">
            {item.price.toFixed(2)} {t('menu.sar')}
          </p>

          {/* Addons */}
          {item.addons.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">
                {t('cart.addons')}:
              </p>
              <div className="flex flex-wrap gap-1">
                {item.addons.map((addon) => (
                  <span
                    key={addon.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-xs"
                  >
                    {addon.name} (+{addon.price.toFixed(2)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">
                {t('cart.notes')}:
              </p>
              <p className="text-xs text-foreground/80 italic">
                {item.notes}
              </p>
            </div>
          )}

          {/* Subtotal */}
          <p className="text-sm font-semibold text-primary mt-2">
            {t('cart.subtotal')}: {item.subtotal.toFixed(2)} {t('menu.sar')}
          </p>
        </div>

        {/* Quantity Controls & Remove */}
        <div className="flex flex-col items-end justify-between gap-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
              aria-label={t('cart.decreaseQuantity')}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <span className="min-w-[2ch] text-center font-semibold text-sm">
              {item.quantity}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrement}
              disabled={item.quantity >= 99}
              aria-label={t('cart.increaseQuantity')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
            aria-label={t('cart.removeItem')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
