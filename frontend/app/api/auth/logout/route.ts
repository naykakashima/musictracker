import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Disable caching

export async function POST() {
  try {
    // Call backend logout endpoint
    await fetch('http://127.0.0.1:5000/logout', {
      credentials: 'include',
    });

    // Clear cookies on client side as well
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed', details: String(error) },
      { status: 500 }
    );
  }
}