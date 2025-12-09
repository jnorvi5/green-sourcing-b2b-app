import { NextRequest, NextResponse } from 'next/server';

// Proxy requests to backend service (for Vercel deployment)
// This allows the Next.js app to communicate with backend services

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const PROXY_TIMEOUT = 30000; // 30 seconds
const EXCLUDED_REQUEST_HEADERS = ['host', 'connection'];
const EXCLUDED_RESPONSE_HEADERS = ['connection', 'keep-alive', 'transfer-encoding'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

/**
 * Proxies requests to the backend service
 * @param request - The incoming Next.js request
 * @param path - Array of path segments from the dynamic route
 * @param method - HTTP method to use
 * @returns Proxied response from backend
 */
async function proxyRequest(
  request: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const targetPath = path.join('/');
  
  // Validate path to prevent SSRF attacks
  if (path.some(segment => segment.includes('..'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Build target URL with query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${BACKEND_URL}/api/${targetPath}${searchParams ? `?${searchParams}` : ''}`;

  console.log('Proxy request:', {
    requestId,
    method,
    path: targetPath,
    timestamp: new Date().toISOString()
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

  try {
    // Forward request headers (excluding hop-by-hop headers)
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      if (!EXCLUDED_REQUEST_HEADERS.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    const options: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    // Include request body for non-GET/HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    }

    const response = await fetch(targetUrl, options);
    clearTimeout(timeoutId);

    // Forward response headers (excluding hop-by-hop headers)
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!EXCLUDED_RESPONSE_HEADERS.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Handle different content types appropriately
    const contentType = response.headers.get('Content-Type') || '';
    let data: string | ArrayBuffer;

    if (contentType.includes('application/json') || contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.arrayBuffer();
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Proxy timeout:', {
        requestId,
        targetUrl,
        method,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    // Handle other errors
    console.error('Proxy error:', {
      requestId,
      targetUrl,
      method,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Backend service unavailable',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 503 }
    );
  }
}
