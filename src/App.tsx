import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import MenuPage from "@/pages/MenuPage";
import CartScreen from "@/components/cart/CartScreen";
import { CheckoutScreen } from "@/components/checkout/CheckoutScreen";
import { MenuDataProvider } from "@/context/MenuDataContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/cart" component={CartScreen} />
        <Route path="/checkout" component={CheckoutScreen} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MenuDataProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </MenuDataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
