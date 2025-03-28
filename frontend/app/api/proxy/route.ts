import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { endpoint, method, data } = body

  const res = await fetch(`http://localhost:5000${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  console.log(res.status);
    console.log(res);
    if (!res.ok) {
        console.error('Error fetching data from API:', res.statusText)
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }
  return NextResponse.json(await res.json())
}