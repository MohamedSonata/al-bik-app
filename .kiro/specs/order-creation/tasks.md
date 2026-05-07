# Implementation Plan: Order Creation Feature

## Overview

This plan implements the order creation feature for the Al-Baik restaurant website, enabling customers to build a cart, manage items with customizations, provide delivery information, and submit orders via Socket.IO. The implementation follows a layered architecture: Type Definitions → Utilities → Services → State Management → UI Components → Integration.

## Tasks

- [x] 1. Install required dependencies
  - Install `uuid` package for UUID generation
  - Install `zustand` package for state management
  - Verify installations with package.json
  - _Requirements: 18.1, 18.2_

- [x] 2. Create type definitions layer
  - [x] 2.1 Create order types file with all TypeScript interfaces
    - Create `src/types/order.types.ts`
    - Define Cart, CartItem, ProductAddon, and AddonType types
    - Define CustomerInfo and DeliveryType types
    - Define OrderRequest, OrderRequestItem, and OrderRequestAddon types
    - Define OrderResponse, OrderData, OrderItem, and OrderError types
    - Define OrderStatus and OrderErrorCode union types
    - Define OrderStatusUpdate interface
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10_

- [x] 3. Create utility functions layer
  - [x] 3.1 Implement UUID generation and addon matching utilities
    - Create `src/utils/order.utils.ts`
    - Implement `generateUUID()` function using uuid v4
    - Implement `addonsMatch()` function for comparing addon lists
    - Implement `findMatchingItem()` function for cart item lookup
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Implement cart calculation utilities
    - Add `calculateTotals()` function to calculate cart subtotal, tax, and total
    - Add `validateQuantity()` function to validate quantity range (1-99)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 1.4_

  - [x] 3.3 Implement error handling utilities
    - Add `getErrorMessage()` function to map error codes to user messages
    - Add `formatOrderStatus()` function to format order status for display
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 4. Create order service layer
  - [x] 4.1 Implement OrderService class with socket integration
    - Create `src/services/order.service.ts`
    - Implement `setSocket()` method to accept socket instance
    - Implement `setCurrentSeatId()` method to store seat ID
    - Implement private `validateCustomerInfo()` method
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.2 Implement order submission with timeout handling
    - Implement `submitOrder()` method with order payload creation
    - Implement private `emitWithTimeout()` method for Socket.IO communication
    - Add 30-second timeout with proper cleanup
    - Handle "customer:order:create:response", "customer:error", and "customer:timeout" events
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 17.1, 17.2, 17.3, 17.4_

  - [x] 4.3 Implement order status update listeners
    - Implement `listenForOrderStatusUpdates()` method
    - Implement `stopListeningForOrderStatus()` method
    - Filter status updates by order ID
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 17.5_

  - [x] 4.4 Export singleton orderService instance
    - Create and export singleton instance
    - _Requirements: 20.1_

- [ ] 5. Checkpoint - Verify foundation layers
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create cart store with Zustand
  - [x] 6.1 Implement cart store interface and initial state
    - Create `src/stores/cart.store.ts`
    - Define CartStore interface with cart state and methods
    - Define initial cart state (empty cart)
    - _Requirements: 1.1, 3.3_

  - [x] 6.2 Implement addItem method
    - Implement `addItem()` method to add products to cart
    - Check for matching items using `findMatchingItem()`
    - Increment quantity if item exists, create new item if not
    - Generate UUID for new cart items
    - Validate quantity limits (1-99)
    - Recalculate totals after adding
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 18.1_

  - [x] 6.3 Implement quantity management methods
    - Implement `updateQuantity()` method to change item quantities
    - Remove item if quantity becomes 0
    - Validate quantity range (0-99)
    - Recalculate totals after update
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.4 Implement removal and clearing methods
    - Implement `removeItem()` method to delete cart items
    - Implement `clearCart()` method to reset cart
    - Update isEmpty flag when cart becomes empty
    - Recalculate totals after removal
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Create cart UI components
  - [x] 7.1 Create CartItemCard component
    - Create `src/components/cart/CartItemCard.tsx`
    - Display item name, price, addons, notes, and subtotal
    - Add increment/decrement buttons with quantity display
    - Add remove button
    - Disable increment at quantity 99, disable decrement at quantity 1
    - _Requirements: 12.1, 12.4, 12.5_

  - [x] 7.2 Create CartScreen component
    - Create `src/components/cart/CartScreen.tsx`
    - Display cart items using CartItemCard
    - Show empty state when cart is empty
    - Display subtotal, tax, and total in order summary
    - Add "Proceed to Checkout" button (disabled when empty)
    - Wire up cart store actions (updateQuantity, removeItem)
    - Add navigation to menu and checkout
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 19.1_

- [x] 8. Create checkout UI components
  - [x] 8.1 Create CustomerInfoForm component
    - Create `src/components/checkout/CustomerInfoForm.tsx`
    - Add name input field with validation (2-100 chars)
    - Add phone input field with validation (required)
    - Add delivery type radio group (pickup/delivery)
    - Add conditional delivery address textarea (10+ chars for delivery)
    - Validate form and notify parent of validity state
    - Display inline validation errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 13.1, 13.4, 19.2_

  - [x] 8.2 Create OrderSuccessModal component
    - Create `src/components/checkout/OrderSuccessModal.tsx`
    - Display success icon and message
    - Show receipt number prominently
    - Display order status, estimated time, and total
    - Show list of ordered items with quantities
    - Add "Done" button to close modal
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 19.3_

  - [x] 8.3 Create CheckoutScreen component
    - Create `src/components/checkout/CheckoutScreen.tsx`
    - Display CustomerInfoForm for customer details
    - Display order summary with cart items and totals
    - Add collapsible order summary for mobile
    - Show connection status indicator
    - Display error messages when submission fails
    - Add "Place Order" button with loading state
    - Disable button when form invalid or disconnected
    - Handle order submission with orderService
    - Show OrderSuccessModal on success
    - Clear cart and navigate on success
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 10.1, 10.2, 14.6, 14.7, 19.2_

- [ ] 9. Checkpoint - Verify UI components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add internationalization translations
  - [x] 10.1 Add English translations
    - Update `src/messages/en.json`
    - Add cart section translations (title, empty, buttons, labels)
    - Add checkout section translations (title, form labels, buttons)
    - Add orderSuccess section translations (title, labels)
    - Add error message translations
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 10.2 Add Arabic translations
    - Update `src/messages/ar.json`
    - Add cart section translations in Arabic
    - Add checkout section translations in Arabic
    - Add orderSuccess section translations in Arabic
    - Add error message translations in Arabic
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 11. Integrate with existing socket service
  - [x] 11.1 Initialize orderService with socket connection
    - Update app initialization or create context provider
    - Connect socket using existing socketService
    - Pass socket instance to orderService using `setSocket()`
    - Set seat ID in orderService after successful seat connection
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 11.2 Add cart and checkout routes
    - Update routing configuration to add `/cart` and `/checkout` routes
    - Wire CartScreen to `/cart` route
    - Wire CheckoutScreen to `/checkout` route
    - _Requirements: 12.6, 13.1_

  - [x] 11.3 Integrate cart with ProductModal
    - Update ProductModal to use cart store's `addItem()` method
    - Pass product, quantity, addons, and notes to cart
    - Show success feedback when item added
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ] 12. Final checkpoint and testing
  - Run full application and test complete order flow
  - Test cart operations (add, update, remove, clear)
  - Test checkout form validation
  - Test order submission with mock/real backend
  - Test error scenarios (connection loss, timeout, validation)
  - Test mobile responsiveness
  - Verify i18n translations display correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All UI components use existing shadcn/ui components for consistency
- The implementation integrates with the existing socket service (no new connection)
- Error handling includes validation, connection, timeout, and server errors
- The cart store uses Zustand for lightweight state management
- All user-facing text uses i18n translation keys for English and Arabic support
- Type safety is enforced throughout with TypeScript interfaces
- Socket.IO event listeners are properly cleaned up to prevent memory leaks
