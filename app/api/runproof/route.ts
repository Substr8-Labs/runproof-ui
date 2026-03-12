import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.RUNPROOF_API_URL || 'https://runproof-api-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[Proxy] Forwarding to:', `${API_URL}/verify`)
    
    const res = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    console.error('[Proxy] Error:', e)
    return NextResponse.json(
      { error: 'Failed to verify proof' },
      { status: 500 }
    )
  }
}
