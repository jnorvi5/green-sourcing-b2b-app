import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/app/actions/quotes', () => ({
  acceptQuote: jest.fn(),
}));

describe('POST /api/rfqs/[id]/accept', () => {
  let mockAcceptQuote: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    const actionsModule = await import('@/app/actions/quotes') as { acceptQuote: jest.Mock };
    mockAcceptQuote = actionsModule.acceptQuote;
  });

  it('should return 400 if quoteId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/rfqs/123/accept', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Quote ID is required');
  });

  it('should call acceptQuote action and return success', async () => {
    mockAcceptQuote.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:3000/api/rfqs/123/accept', {
      method: 'POST',
      body: JSON.stringify({ quoteId: 'quote-123' }),
    });

    const response = await POST(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAcceptQuote).toHaveBeenCalledWith({ quoteId: 'quote-123', rfqId: '123' });
  });

  it('should return 500 if action fails', async () => {
    mockAcceptQuote.mockResolvedValue({ success: false, error: 'Database error' });

    const request = new NextRequest('http://localhost:3000/api/rfqs/123/accept', {
      method: 'POST',
      body: JSON.stringify({ quoteId: 'quote-123' }),
    });

    const response = await POST(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});
