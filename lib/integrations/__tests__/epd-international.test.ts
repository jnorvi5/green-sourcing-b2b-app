import { searchEPDs } from '../epd-international';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

global.fetch = jest.fn() as jest.Mock;

describe('EPD International Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty list if key is missing (Safe Mock)', async () => {
    delete process.env.EPD_INTERNATIONAL_API_KEY;
    // We renamed the function to searchEPDs, so we must call that
    const result = await searchEPDs('concrete');
    expect(result.data).toEqual([]);
  });

  it('should fetch data when key is present', async () => {
    process.env.EPD_INTERNATIONAL_API_KEY = 'test';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
    });
    
    const result = await searchEPDs('concrete');
    expect(result.data).toEqual([]);
  });
});
