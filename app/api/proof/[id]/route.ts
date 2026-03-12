import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.RUNPROOF_API_URL || 'https://runproof-api-production.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const proofId = params.id
  const url = `${API_URL}/proof/${proofId}`
  
  console.log('[Proxy] Fetching proof from:', url)
  
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    console.log('[Proxy] Response status:', res.status)
    
    if (!res.ok) {
      const text = await res.text()
      console.log('[Proxy] Error response:', text)
      return NextResponse.json(
        { error: 'Proof not found', detail: text },
        { status: res.status }
      )
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('[Proxy] Exception:', err)
    return NextResponse.json(
      { error: 'Failed to fetch proof', detail: err, url },
      { status: 500 }
    )
  }
}
