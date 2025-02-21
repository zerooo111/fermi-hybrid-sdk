enum OrderIntentSide {
  BUY = 'Buy',
  SELL = 'Sell',
}

/* This represents the data that will be encoded in the message to be signed */
type OrderIntentSignMessage = {
  price: number,
  quantity: number,
  order_id: number 
  side: OrderIntentSide,
  owner: string,
  expiry: number
}

/* Order Intent Request */
type PlaceOrderIntentRequest = {
  intent: OrderIntentSignMessage,
  signature: string,
}


