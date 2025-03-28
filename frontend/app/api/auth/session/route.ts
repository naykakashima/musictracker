// app/api/auth/session/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Disable caching

export async function GET() {
  try {
    const response = await fetch('http://localhost:5000/dashboard', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Session invalid' },
        { status: 401 }
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed', details: error },
      { status: 500 }
    )
  }
}