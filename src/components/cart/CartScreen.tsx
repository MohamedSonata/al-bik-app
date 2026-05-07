import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ShoppingCart, ArrowLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoldDivider } from '@/components/ui/GoldDivider';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { CartItemCard } from './CartItemCard';
import { useCartStore } from '@/stores/cart.store';

export default function CartScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [, setLocation] = useLocation();
  
  const { cart, updateQuantity, removeItem } = useCartStore();

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    try {
      updateQuantity(itemId, quantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    try {
      removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleProceedToCheckout = () => {
    setLocation('/checkout');
  };

  const handleBackToMenu = () => {
    setLocation('/menu');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-brand-charcoal flex flex-col"
    >
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Cart Header */}
        <section className="relative py-16 md:py-24 overflow-hidden bg-brand-surface">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,hsl(35,90%,55%)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal via-transparent to-brand-charcoal" />

          <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="font-heading text-5xl md:text-7xl font-bold bg-gradient-to-r from-brand-crimson via-brand-gold to-brand-amber bg-clip-text text-transparent mb-4 tracking-wider drop-shadow-xl">
              {t('cart.title')}
            </h1>
            <p className="font-body text-xl md:text-2xl text-brand-gold/80 uppercase tracking-[0.2em]">
              {cart.itemCount} {t('cart.items')}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <GoldDivider />
          </div>
        </section>

        {/* Cart Content */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Back to Menu Button */}
            <Button
              variant="ghost"
              onClick={handleBackToMenu}
              className="mb-6 text-brand-gold hover:text-brand-gold/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('cart.backToMenu')}
            </Button>

            {cart.isEmpty ? (
              /* Empty State */
              <Empty className="min-h-[400px]">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShoppingCart className="w-6 h-6" />
                  </EmptyMedia>
                  <EmptyTitle>{t('cart.emptyTitle')}</EmptyTitle>
                  <EmptyDescription>
                    {t('cart.emptyDescription')}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={handleBackToMenu} className="w-full sm:w-auto">
                    {t('cart.browseMenu')}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              /* Cart Items and Summary */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle>{t('cart.orderSummary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Subtotal */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('cart.subtotal')}
                        </span>
                        <span className="font-medium">
                          {cart.subtotal.toFixed(2)} {t('menu.sar')}
                        </span>
                      </div>

                      {/* Tax */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('cart.tax')}
                        </span>
                        <span className="font-medium">
                          {cart.tax.toFixed(2)} {t('menu.sar')}
                        </span>
                      </div>

                      <div className="border-t pt-4">
                        {/* Total */}
                        <div className="flex justify-between text-lg font-bold mb-6">
                          <span>{t('cart.total')}</span>
                          <span className="text-primary">
                            {cart.total.toFixed(2)} {t('menu.sar')}
                          </span>
                        </div>

                        {/* Proceed to Checkout Button */}
                        <Button
                          onClick={handleProceedToCheckout}
                          disabled={cart.isEmpty}
                          className="w-full"
                          size="lg"
                        >
                          {t('cart.proceedToCheckout')}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </motion.div>
  );
}
