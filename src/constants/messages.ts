export const messages = {
  AUTH: {
    REGISTER_SUCCESS: "Registered successfully",
    LOGIN_SUCCESS: "Logged in successfully",
    ME_SUCCESS: "User profile fetched successfully",
    DELETED_SUCCESS: "User deleted successfully",
    INVALID_BODY: "Invalid request body",
    EMAIL_EXISTS: "Email already registered",
    INVALID_CREDENTIALS: "Invalid email or password",
  },
  CATEGORIES: {
    LIST_SUCCESS: "Categories fetched successfully",
    CREATE_SUCCESS: "Category created successfully",
    NAME_REQUIRED: "Category name is required",
    ALREADY_EXISTS: "Category name already exists",
    UNKNOWN: "Unknown category",
    DELETED_SUCCESS: "Category deleted successfully"
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
    NOT_FOUND_ITEM: "Cart item not found",
  },
  ORDER: {
    CHECKOUT_SUCCESS: "Checkout completed successfully",
    GET_MY_ORDERS_SUCCESS: "My orders fetched successfully",
    GET_ORDER_DETAILS_SUCCESS: "My order details fetched successfully",
    CANCEL_ORDER_SUCCESS: "Order cancelled successfully",
    REJECT_ORDER_SUCCESS: "Order rejected successfully",
    DELIVERED_ORDER_SUCCESS: "Order delivered successfully",
    ORDER_ID_REQUIRED: "Order id is required",
    ORDER_NOT_IN_DELIVERED: "Order not found or not in DELIVERED status",
    RETURN_TIME_EXPIRED: "Return window has expired for this order",
    REQUEST_ALREADY_EXIST: "A return request already exists for this order",
  },
  RETURN: {
    REQUEST_NOT_FOUND_OR_EXIST: "Return request not found or already processed",
    REQUEST_NOT_FOUND: "Return request not found",
    REQUEST_SUCCESS: "Return request created successfully",
    REQUEST_APPROVE: "Return approved successfully",
    REQUEST_REJECTED: "Return rejected successfully",
    FETCH_SUCCESS: "Returns fetched successfully",
  },
  REVIEW: {
    NOT_ELIGIBLE: "Order not found or not eligible for review",
    ALREADY_HAVE_REVIEW: "You have already reviewed this product",
    ADDED_SUCCESS: "Review created successfully",
    UPDATE_SUCCESS: "Review updated successfully",
    DELTED_SUCCESS: "Review deleted successfully",
  },
  NOTIFICATION: {
    GET_SUCCESS: "Notification fetched successfully"
  },
  ADDRESS: {
    SET_PRIMARY_ADDRESS_FIRST: "No primary address found. Please add and set a primary address first.",
    ADDRESS_REQUIRED: "Address is required when primaryAddress is false",
    ADD_SUCCESS: "Address added successfully",
    FETCH_SUCCESS: "Addresses fetched successfully",
    PRIMARY_ADD_SUCCESS: "Primary address updated successfully",
    DELETED_SUCCESS: "Address deleted successfully",
  },
  CATEGORY: {
    PRODUCT_EXIST_IN_CATEGORY: "Product exist in this category, thats why you can't delete category"
  },
  COMMON: {

    PRODUCT_NOT_FOUND: "Product not found",
    CART_NOT_FOUND: "Cart not found",
    ORDER_NOT_FOUND: "Order not found",
    CATEGORY_NOT_FOUND: "Category not found",
    REVIEW_NOT_FOUND: "Review not found",
    USER_NOT_FOUND: "User not found",
    ADDRESS_NOT_FOUND: "Address not found",

    CART_IS_EMPTY: "Cart is empty",

    INVALID_USER: "Invalid user id",
    INVALID_BUYER: "Invalid buyer id",
    INVALID_SELLER: "Invalid seller id",
    INVALID_ADMIN: "Invalid admin id",
    INVALID_PRODUCT: "Invalid product id",
    INVALID_CATEGORY: "Invalid category id",
    INVALID_ORDER: "Invalid order id",
    INVALID_RETURN: "Invalid return id",
    INVALID_REVIEW: "Invalid review id",
    INVALID_ADDRESS: "Invalid address id",

    INSUFFICIENT_STOCK: "Insufficient stock",

    FAILED_TO_LOAD: "Failed to load product",

    OK: "OK",
  },
} as const;

