export class SDKClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.default.com';
  }

  signMessage(message: string) {
    return this.apiKey;
  }

  placeOrder(order: any) {
    return this.apiKey;
  }

  cancelOrder(orderId: string) {
    return this.apiKey;
  }

  getOrderbook(symbol: string) {
    return this.apiKey;
  }



}