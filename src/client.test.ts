import { SDKClient } from './client';

describe('SDKClient', () => {
  it('should initialize with config', () => {
    const client = new SDKClient({ apiKey: 'test-key' });
    expect(client).toBeInstanceOf(SDKClient);
  });
}); 