import { NextRequest, NextResponse } from 'next/server';
import { acceptQuote } from '@/app/actions/quotes';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params; // RFQ ID
    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Call the server action logic
    const result = await acceptQuote({ quoteId, rfqId: id });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to accept quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Quote accepted successfully' });
  } catch (error) {
    console.error('Error in accept quote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
