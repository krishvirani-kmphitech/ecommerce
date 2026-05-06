export const messages = {
  AUTH: {
    REGISTER_SUCCESS: "Registered successfully",
    LOGIN_SUCCESS: "Logged in successfully",
    ME_SUCCESS: "User profile fetched successfully",
    INVALID_BODY: "Invalid request body",
    EMAIL_EXISTS: "Email already registered",
    INVALID_CREDENTIALS: "Invalid email or password",
  },
  CATEGORIES: {
    LIST_SUCCESS: "Categories fetched successfully",
    CREATE_SUCCESS: "Category created successfully",
  },
  PRODUCTS: {
    LIST_SUCCESS: "Products fetched successfully",
    GET_SUCCESS: "Product fetched successfully",
    LIST_MINE_SUCCESS: "Seller products fetched successfully",
    CREATE_SUCCESS: "Product created successfully",
    UPDATE_SUCCESS: "Product updated successfully",
    DELETE_SUCCESS: "Product deleted successfully",
  },
  CART: {
    GET_SUCCESS: "Cart fetched successfully",
    ADD_ITEM_SUCCESS: "Item added to cart",
    UPDATE_ITEM_SUCCESS: "Cart item updated",
    REMOVE_ITEM_SUCCESS: "Cart item removed",
  },
  ORDER: {
    CHECKOUT_SUCCESS: "Checkout completed successfully",
    GET_MY_ORDERS_SUCCESS: "My orders fetched successfully",
    GET_ORDER_DETAILS_SUCCESS: "My order details fetched successfully",
    CANCEL_ORDER_SUCCESS: "Order cancelled successfully",
    REJECT_ORDER_SUCCESS: "Order rejected successfully",
    DELIVERED_ORDER_SUCCESS: "Order delivered successfully",
    ORDER_ID_REQUIRED: "Order id is required"
  },
  COMMON: {
    OK: "OK",
  },
} as const;

