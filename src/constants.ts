const FERMI_DEX_ORDER_PREFIX = "FRM_DEX_ORDER:"

// Base URL for the API
const API_BASE_URL = "https://api.fermidex.com"


// Routes for the API
const API_ROUTES = {
  PLACE_ORDER_INTENT_ROUTE : "/place_order",
  CANCEL_ORDER_ROUTE : "/cancel_order",
  GET_ORDERBOOK_ROUTE : "/get_orderbook",
}

export {
  FERMI_DEX_ORDER_PREFIX,
  API_BASE_URL,
  API_ROUTES,
}
