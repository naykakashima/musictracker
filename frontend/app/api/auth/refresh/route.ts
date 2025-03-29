import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching

export async function POST() {
  try {
    const response = await fetch('http://127.0.0.1:5000/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: response.status }
      );
    }

    // Return with the same Set-Cookie headers from the backend
    const result = await response.json();
    const newResponse = NextResponse.json(result);

    // Forward any cookies set by the backend
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        newResponse.headers.append(key, value);
      }
    });

    return newResponse;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed', details: String(error) },
      { status: 500 }
    );
  }
}