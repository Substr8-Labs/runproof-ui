import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.RUNPROOF_API_URL || 'https://api.runproof.substr8labs.com'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proofId = params.id
    console.log('[Proxy] Fetching proof:', proofId)
    
    const res = await fetch(`${API_URL}/proof/${proofId}`)
    
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: res.status }
      )
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[Proxy] Error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch proof' },
      { status: 500 }
    )
  }
}
