import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, baseUrl = 'http://localhost:5000', method = 'GET', data } = body;
    
    // Get the full URL
    const url = `${baseUrl}${endpoint}`;
    console.log(`Proxying request to: ${url}`);
    
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');
    
    // Prepare headers with Authorization if token exists
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken.value}`;
    }
    
    // Forward all cookies as a single header
    const allCookies = cookieStore.getAll();
    if (allCookies.length > 0) {
      const cookieString = allCookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      headers['Cookie'] = cookieString;
    }
    
    // Make the request to the backend
    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include', 
      body: data ? JSON.stringify(data) : undefined,
    });
    
    // Read the response data
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // If not successful, return error with proper status
    if (!response.ok) {
      console.error(`Backend error: ${response.status} - ${typeof responseData === 'string' ? responseData : JSON.stringify(responseData)}`);
      return NextResponse.json(
        { error: typeof responseData === 'string' ? responseData : responseData.error || response.statusText },
        { status: response.status }
      );
    }
    
    // Return the successful response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    );
  }
}