import { useTranslation } from 'react-i18next';
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
import type { OrderData } from '@/types/order.types';
import { formatOrderStatus } from '@/utils/order.utils';

interface OrderSuccessModalProps {
  open: boolean;
  onClose: () => void;
  orderData: OrderData;
}

export function OrderSuccessModal({ open, onClose, orderData }: OrderSuccessModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {t('orderSuccess.title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('orderSuccess.thankYou')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Receipt Number */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t('orderSuccess.receiptNumber')}
            </p>
            <p className="text-2xl font-bold">{orderData.receiptNumber}</p>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('orderSuccess.orderStatus')}</span>
              <span className="font-medium">{formatOrderStatus(orderData.status)}</span>
            </div>

            {/* Estimated Time */}
            {orderData.estimatedTime && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('orderSuccess.estimatedTime')}</span>
                <span className="font-medium">
                  {orderData.estimatedTime} {t('orderSuccess.minutes')}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t('orderSuccess.orderTotal')}</span>
              <span className="text-lg font-bold">
                {orderData.total.toFixed(2)} {t('menu.sar')}
              </span>
            </div>
          </div>

          {/* Order Items */}
          {orderData.items && orderData.items.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('orderSuccess.orderedItems')}</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orderData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                  >
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {item.subtotal.toFixed(2)} {t('menu.sar')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {t('orderSuccess.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
