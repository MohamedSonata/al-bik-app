# Requirements Document

## Introduction

This document specifies the requirements for implementing order creation functionality in a React/TypeScript restaurant website application. The system enables customers to build a cart, manage items with addons, provide customer information, and submit orders to a POS backend via Socket.IO real-time communication.

## Glossary

- **Cart_Manager**: The state management system that handles cart operations (add, update, remove items)
- **Order_Service**: The service layer that handles order submission via Socket.IO
- **Socket_Service**: The existing Socket.IO client service for real-time communication
- **POS_Backend**: The Point of Sale backend system that processes orders
- **Cart_Item**: A product in the cart with quantity, addons, and notes
- **Product_Addon**: An additional item that can be added to a product (e.g., extra cheese, sauce)
- **Customer_Info**: Customer details including name, phone, delivery type, and optional address
- **Order_Request**: The complete order payload sent to the POS backend
- **Order_Response**: The response from the POS backend after order submission
- **Receipt_Number**: A unique identifier for a submitted order (e.g., "ORD-12345")

## Requirements

### Requirement 1: Cart Item Management

**User Story:** As a customer, I want to add products to my cart with customizations, so that I can build my order before checkout

#### Acceptance Criteria

1. WHEN a customer adds a product to an empty cart, THE Cart_Manager SHALL create a new cart item with quantity 1
2. WHEN a customer adds the same product with identical addons to the cart, THE Cart_Manager SHALL increment the existing cart item quantity
3. WHEN a customer adds the same product with different addons to the cart, THE Cart_Manager SHALL create a separate cart item
4. WHEN a customer adds a product with quantity outside the range 1-99, THE Cart_Manager SHALL reject the operation with an error message
5. THE Cart_Manager SHALL generate a unique UUID for each cart item
6. THE Cart_Manager SHALL store product ID, name, price, quantity, addons, and optional notes for each cart item

### Requirement 2: Cart Quantity Management

**User Story:** As a customer, I want to adjust item quantities in my cart, so that I can order the correct amount

#### Acceptance Criteria

1. WHEN a customer increments a cart item quantity, THE Cart_Manager SHALL increase the quantity by 1
2. WHEN a customer decrements a cart item quantity to 0, THE Cart_Manager SHALL remove the item from the cart
3. WHEN a customer sets a cart item quantity above 99, THE Cart_Manager SHALL reject the operation with an error message
4. WHEN a customer updates a cart item quantity, THE Cart_Manager SHALL recalculate the item subtotal
5. THE Cart_Manager SHALL multiply both base price and addon prices by the quantity when calculating item subtotal

### Requirement 3: Cart Removal and Clearing

**User Story:** As a customer, I want to remove items from my cart, so that I can correct mistakes

#### Acceptance Criteria

1. WHEN a customer removes a cart item, THE Cart_Manager SHALL delete the item from the cart
2. WHEN a customer clears the cart, THE Cart_Manager SHALL remove all items and reset totals to zero
3. WHEN the cart becomes empty, THE Cart_Manager SHALL set the isEmpty flag to true
4. THE Cart_Manager SHALL recalculate totals after any removal operation

### Requirement 4: Cart Total Calculations

**User Story:** As a customer, I want to see accurate pricing, so that I know how much I will pay

#### Acceptance Criteria

1. THE Cart_Manager SHALL calculate subtotal as the sum of all cart item subtotals
2. THE Cart_Manager SHALL set tax to 0 (zero percent tax rate)
3. THE Cart_Manager SHALL calculate total as subtotal plus tax
4. WHEN cart items change, THE Cart_Manager SHALL recalculate subtotal, tax, and total
5. THE Cart_Manager SHALL calculate item subtotal as (base price × quantity) + (sum of addon prices × quantity)
6. THE Cart_Manager SHALL maintain item count as the sum of all item quantities

### Requirement 5: Product Addon Matching

**User Story:** As a customer, I want items with the same customizations to be grouped together, so that my cart is organized

#### Acceptance Criteria

1. WHEN comparing two cart items, THE Cart_Manager SHALL consider them identical if product ID and all addon IDs match
2. WHEN comparing addon lists, THE Cart_Manager SHALL sort addons by ID before comparison
3. WHEN addon lists have different lengths, THE Cart_Manager SHALL consider them non-matching
4. THE Cart_Manager SHALL store addon ID, name, price, and type for each addon

### Requirement 6: Customer Information Validation

**User Story:** As a customer, I want to provide my contact information, so that the restaurant can process my order

#### Acceptance Criteria

1. WHEN a customer submits an order, THE Order_Service SHALL validate that customer name is between 2 and 100 characters
2. WHEN a customer submits an order, THE Order_Service SHALL validate that phone number is not empty
3. WHEN a customer selects delivery type "delivery", THE Order_Service SHALL validate that delivery address is at least 10 characters
4. WHEN a customer selects delivery type "pickup", THE Order_Service SHALL allow empty delivery address
5. IF customer information is invalid, THEN THE Order_Service SHALL reject the order with a descriptive error message

### Requirement 7: Order Submission via Socket.IO

**User Story:** As a customer, I want to submit my order to the restaurant, so that they can prepare my food

#### Acceptance Criteria

1. WHEN a customer submits an order, THE Order_Service SHALL generate a unique UUID request ID
2. WHEN a customer submits an order, THE Order_Service SHALL emit a "customer:order:create" event with the complete order payload
3. THE Order_Service SHALL include customer socket ID, request ID, public seat ID, customer info, cart items, subtotal, tax, total, and ISO 8601 timestamp in the order payload
4. THE Order_Service SHALL convert cart items to order request items with product ID, name, price, quantity, addons, and notes
5. THE Order_Service SHALL convert addons to order request addons with ID, name, price, and type
6. WHEN the cart is empty, THE Order_Service SHALL reject the order submission with an error message

### Requirement 8: Order Submission Timeout Handling

**User Story:** As a customer, I want to know if my order submission is taking too long, so that I can retry

#### Acceptance Criteria

1. WHEN an order is submitted, THE Order_Service SHALL wait up to 30 seconds for a response
2. IF no response is received within 30 seconds, THEN THE Order_Service SHALL reject the order with a timeout error message
3. WHEN a timeout occurs, THE Order_Service SHALL clean up all Socket.IO event listeners
4. THE Order_Service SHALL listen for "customer:order:create:response", "customer:error", and "customer:timeout" events
5. WHEN any response event is received, THE Order_Service SHALL cancel the timeout timer

### Requirement 9: Order Response Handling

**User Story:** As a customer, I want to receive confirmation of my order, so that I know it was successful

#### Acceptance Criteria

1. WHEN the POS_Backend responds with success true, THE Order_Service SHALL resolve with the order data
2. WHEN the POS_Backend responds with success false, THE Order_Service SHALL reject with the error message
3. THE Order_Service SHALL extract order ID, receipt number, status, total, items, and estimated time from successful responses
4. WHEN the POS_Backend emits "customer:error", THE Order_Service SHALL reject with the error message
5. WHEN the POS_Backend emits "customer:timeout", THE Order_Service SHALL reject with a server timeout error message

### Requirement 10: Socket Connection Validation

**User Story:** As a customer, I want to be notified if my connection is lost, so that I don't submit orders that won't be received

#### Acceptance Criteria

1. WHEN a customer attempts to submit an order, THE Order_Service SHALL verify the Socket.IO connection is active
2. IF the Socket.IO connection is not active, THEN THE Order_Service SHALL reject the order with a connection error message
3. THE Order_Service SHALL check that the socket is connected before emitting any events
4. WHEN the socket disconnects during order submission, THE Order_Service SHALL handle the error gracefully

### Requirement 11: Order Status Updates

**User Story:** As a customer, I want to receive real-time updates about my order status, so that I know when it's ready

#### Acceptance Criteria

1. WHEN an order is submitted successfully, THE Order_Service SHALL listen for "customer:order:status:update" events
2. WHEN a status update is received, THE Order_Service SHALL filter by order ID
3. WHEN a status update matches the order ID, THE Order_Service SHALL invoke the provided callback with the update
4. THE Order_Service SHALL extract order ID, status, timestamp, estimated time, and optional message from status updates
5. THE Order_Service SHALL provide a method to stop listening for order status updates

### Requirement 12: Cart Screen Display

**User Story:** As a customer, I want to view my cart contents, so that I can review my order before checkout

#### Acceptance Criteria

1. THE Cart_Screen SHALL display all cart items with product name, quantity, addons, and subtotal
2. THE Cart_Screen SHALL display subtotal, tax, and total amounts
3. WHEN the cart is empty, THE Cart_Screen SHALL display an empty state message
4. THE Cart_Screen SHALL provide increment and decrement buttons for each cart item
5. THE Cart_Screen SHALL provide a remove button for each cart item
6. THE Cart_Screen SHALL provide a "Proceed to Checkout" button
7. WHEN the cart is empty, THE Cart_Screen SHALL disable the "Proceed to Checkout" button

### Requirement 13: Checkout Screen Display

**User Story:** As a customer, I want to provide my information and submit my order, so that I can complete my purchase

#### Acceptance Criteria

1. THE Checkout_Screen SHALL display a customer information form with name, phone, delivery type, and conditional delivery address fields
2. THE Checkout_Screen SHALL display an order summary with all cart items and total
3. THE Checkout_Screen SHALL display a "Place Order" button
4. WHEN customer information is invalid, THE Checkout_Screen SHALL disable the "Place Order" button
5. WHEN the socket is disconnected, THE Checkout_Screen SHALL disable the "Place Order" button and display a connection warning
6. WHEN order submission is in progress, THE Checkout_Screen SHALL display a loading state and disable the "Place Order" button
7. WHEN an error occurs, THE Checkout_Screen SHALL display the error message to the customer

### Requirement 14: Order Success Confirmation

**User Story:** As a customer, I want to see confirmation of my order, so that I have proof of my purchase

#### Acceptance Criteria

1. WHEN an order is submitted successfully, THE Order_Success_Modal SHALL display the receipt number
2. THE Order_Success_Modal SHALL display the order status
3. THE Order_Success_Modal SHALL display the estimated preparation time if available
4. THE Order_Success_Modal SHALL display the order total
5. THE Order_Success_Modal SHALL display the list of ordered items with quantities
6. WHEN the customer closes the success modal, THE Cart_Manager SHALL clear the cart
7. WHEN the customer closes the success modal, THE Checkout_Screen SHALL navigate back to the previous screen

### Requirement 15: Error Message Mapping

**User Story:** As a customer, I want to understand what went wrong, so that I can take corrective action

#### Acceptance Criteria

1. WHEN the POS_Backend returns error code "PRODUCT_UNAVAILABLE", THE Order_Service SHALL map it to "One or more products are currently unavailable"
2. WHEN the POS_Backend returns error code "INSUFFICIENT_STOCK", THE Order_Service SHALL map it to "Insufficient stock for requested quantity"
3. WHEN the POS_Backend returns error code "INVALID_CUSTOMER_INFO", THE Order_Service SHALL map it to "Invalid customer information"
4. WHEN the POS_Backend returns an unknown error code, THE Order_Service SHALL map it to "Order submission failed. Please try again."
5. WHEN a connection error occurs, THE Order_Service SHALL map it to "Connection lost. Please check your internet and try again."

### Requirement 16: TypeScript Type Definitions

**User Story:** As a developer, I want complete type definitions, so that I can write type-safe code

#### Acceptance Criteria

1. THE Type_Definitions SHALL define Cart interface with items, subtotal, tax, total, isEmpty, and itemCount
2. THE Type_Definitions SHALL define CartItem interface with id, productId, name, price, quantity, addons, notes, and subtotal
3. THE Type_Definitions SHALL define ProductAddon interface with id, name, price, and type
4. THE Type_Definitions SHALL define CustomerInfo interface with name, phone, deliveryType, and optional deliveryAddress
5. THE Type_Definitions SHALL define OrderRequest interface matching the Socket.IO event payload structure
6. THE Type_Definitions SHALL define OrderResponse interface matching the Socket.IO response structure
7. THE Type_Definitions SHALL define OrderData interface with order details from successful responses
8. THE Type_Definitions SHALL define OrderStatusUpdate interface for real-time status updates
9. THE Type_Definitions SHALL define OrderStatus as a union type of "pending", "confirmed", "preparing", "ready", "completed", "cancelled"
10. THE Type_Definitions SHALL define AddonType as a union type of "extra", "sauce", "side", "topping"

### Requirement 17: Socket.IO Event Listener Cleanup

**User Story:** As a developer, I want proper cleanup of event listeners, so that there are no memory leaks

#### Acceptance Criteria

1. WHEN an order submission completes, THE Order_Service SHALL remove all temporary event listeners
2. WHEN an order submission times out, THE Order_Service SHALL remove all temporary event listeners
3. WHEN an order submission errors, THE Order_Service SHALL remove all temporary event listeners
4. THE Order_Service SHALL use "once" listeners for single-use events when possible
5. WHEN stopping order status listening, THE Order_Service SHALL remove the "customer:order:status:update" listener

### Requirement 18: UUID Generation

**User Story:** As a developer, I want unique identifiers for cart items and requests, so that items can be tracked correctly

#### Acceptance Criteria

1. THE Cart_Manager SHALL generate a UUID v4 for each new cart item
2. THE Order_Service SHALL generate a UUID v4 for each order request
3. THE UUID_Generator SHALL follow the format "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
4. THE UUID_Generator SHALL use cryptographically random values

### Requirement 19: Internationalization Support

**User Story:** As a customer, I want to see the interface in my preferred language, so that I can understand the content

#### Acceptance Criteria

1. THE Cart_Screen SHALL use i18n translation keys for all user-facing text
2. THE Checkout_Screen SHALL use i18n translation keys for all user-facing text
3. THE Order_Success_Modal SHALL use i18n translation keys for all user-facing text
4. THE Error_Messages SHALL use i18n translation keys for all error text
5. THE UI_Components SHALL support both English and Arabic languages

### Requirement 20: Integration with Existing Socket Service

**User Story:** As a developer, I want to use the existing Socket.IO service, so that there is a single connection point

#### Acceptance Criteria

1. THE Order_Service SHALL accept the existing Socket_Service instance as a dependency
2. THE Order_Service SHALL use the Socket_Service to get the socket instance
3. THE Order_Service SHALL use the Socket_Service to check connection status
4. THE Order_Service SHALL not create a new Socket.IO connection
5. THE Order_Service SHALL use the same socket instance for all order-related events
