import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET() {
  try {
    console.log('Session API called');
    
    // Get all cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name));
    
    // First try with JWT cookie approach
    const accessToken = cookieStore.get('access_token');
    console.log('Access token cookie:', accessToken ? accessToken.value : 'Not found');
    console.log('JWT token found:', accessToken ? 'Yes' : 'No');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    // Try to get the original Spotify token from the database via the API
    console.log('Attempting to get user data with JWT');
    const response = await fetch('http://localhost:5000/api/me', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        // Send the JWT token as a Bearer token explicitly
        'Authorization': `Bearer ${accessToken.value}`
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error fetching data from API:', response.statusText);
      
      // Try to get error details
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response', e);
      }
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Get the response data
    const userData = await response.json();
    console.log('User data retrieved successfully', userData);
    
    // Check if token was refreshed
    if (userData.token_refreshed) {
      console.log('JWT token was refreshed, forwarding Set-Cookie header');
      
      // Forward the token refresh to the client
      const res = NextResponse.json(userData);
      
      // Get and forward any Set-Cookie headers
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        res.headers.set('Set-Cookie', setCookieHeader);
      }
      
      return res;
    }
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: String(error) },
      { status: 500 }
    );
  }
}