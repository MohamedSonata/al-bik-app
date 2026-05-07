import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomerInfoForm } from './CustomerInfoForm';
import { OrderSuccessModal } from './OrderSuccessModal';
import { useCartStore } from '@/stores/cart.store';
import { orderService } from '@/services/order.service';
import { socketService } from '@/services/socket.service';
import type { CustomerInfo } from '@/types/order.types';
import type { OrderData } from '@/types/order.types';
import { getErrorMessage } from '@/utils/order.utils';

export function CheckoutScreen() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { cart, clearCart } = useCartStore();

  const [isFormValid, setIsFormValid] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isConnected, setIsConnected] = useState(socketService.isConnected);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<'validating' | 'submitting' | 'waiting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);

  // Monitor socket connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isConnected);
    };

    // Check connection every second
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.isEmpty) {
      setLocation('/cart');
    }
  }, [cart.isEmpty, setLocation]);

  const handleFormValidityChange = (isValid: boolean, info: CustomerInfo | null) => {
    setIsFormValid(isValid);
    setCustomerInfo(info);
  };

  const handlePlaceOrder = async () => {
    if (!customerInfo || !isFormValid) {
      setError(t('checkout.formInvalid'));
      return;
    }

    if (!isConnected) {
      setError(t('checkout.connectionLost'));
      return;
    }

    setIsSubmitting(true);
    setSubmissionStage('validating');
    setError(null);

    try {
      const response = await orderService.submitOrder(
        customerInfo, 
        cart, 
        undefined,
        (stage) => {
          setSubmissionStage(stage);
        }
      );

      if (response.success && response.order) {
        setOrderData(response.order);
        setShowSuccessModal(true);
      } else if (response.error) {
        setError(getErrorMessage(response.error.code));
      } else {
        setError(getErrorMessage());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : getErrorMessage();
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setSubmissionStage(null);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    clearCart();
    setLocation('/menu');
  };

  const isPlaceOrderDisabled = !isFormValid || !isConnected || isSubmitting || cart.isEmpty;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Customer Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('checkout.title')}</h1>
            <p className="text-muted-foreground">{t('checkout.subtitle', 'Complete your order')}</p>
          </div>

          {/* Connection Status */}
          <Alert variant={isConnected ? 'default' : 'destructive'}>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <AlertDescription>{t('checkout.connected', 'Connected')}</AlertDescription>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <AlertDescription>{t('checkout.connectionLost')}</AlertDescription>
                </>
              )}
            </div>
          </Alert>

          {/* Customer Information Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t('checkout.customerInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerInfoForm onValidityChange={handleFormValidityChange} />
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submission Progress */}
          {isSubmitting && submissionStage && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {submissionStage === 'validating' && (
                  <div>
                    <p className="font-medium">{t('checkout.validating')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('checkout.validatingDesc', 'Checking order details...')}
                    </p>
                  </div>
                )}
                {submissionStage === 'submitting' && (
                  <div>
                    <p className="font-medium">{t('checkout.submittingOrder')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('checkout.submittingDesc', 'Sending order to restaurant...')}
                    </p>
                  </div>
                )}
                {submissionStage === 'waiting' && (
                  <div>
                    <p className="font-medium">{t('checkout.waitingAcceptance')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('checkout.waitingDesc', 'Please wait while the restaurant reviews your order. This may take up to 2 minutes.')}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          {/* Mobile Collapsible Order Summary */}
          <div className="lg:hidden">
            <Collapsible open={isOrderSummaryOpen} onOpenChange={setIsOrderSummaryOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('cart.orderSummary')}</CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        isOrderSummaryOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <OrderSummaryContent cart={cart} t={t} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Desktop Order Summary */}
          <Card className="hidden lg:block sticky top-8">
            <CardHeader>
              <CardTitle>{t('cart.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderSummaryContent cart={cart} t={t} />
            </CardContent>
          </Card>

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            disabled={isPlaceOrderDisabled}
            className="w-full lg:sticky lg:bottom-8"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {submissionStage === 'validating' && t('checkout.validating', 'Validating...')}
                {submissionStage === 'submitting' && t('checkout.submittingOrder', 'Submitting order...')}
                {submissionStage === 'waiting' && t('checkout.waitingAcceptance', 'Waiting for acceptance...')}
                {!submissionStage && t('checkout.placingOrder')}
              </>
            ) : (
              t('checkout.placeOrder')
            )}
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      {orderData && (
        <OrderSuccessModal
          open={showSuccessModal}
          onClose={handleSuccessModalClose}
          orderData={orderData}
        />
      )}
    </div>
  );
}

// Helper component for order summary content
function OrderSummaryContent({ cart, t }: { cart: any; t: any }) {
  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cart.items.map((item: any) => (
          <div key={item.id} className="flex justify-between items-start gap-3 pb-3 border-b">
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {t('cart.quantity')}: {item.quantity}
              </p>
              {item.addons.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {item.addons.map((addon: any) => addon.name).join(', ')}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-muted-foreground italic">{item.notes}</p>
              )}
            </div>
            <p className="font-medium whitespace-nowrap">
              {item.subtotal.toFixed(2)} {t('menu.sar')}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('cart.subtotal')}</span>
          <span>{cart.subtotal.toFixed(2)} {t('menu.sar')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('cart.tax')}</span>
          <span>{cart.tax.toFixed(2)} {t('menu.sar')}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>{t('cart.total')}</span>
          <span>{cart.total.toFixed(2)} {t('menu.sar')}</span>
        </div>
      </div>
    </div>
  );
}
