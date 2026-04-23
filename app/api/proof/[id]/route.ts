import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.RUNPROOF_API_URL || 'https://runproof-api-production.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const proofId = params.id

  try {
    // Fetch both inspect and verify in parallel
    const [inspectRes, verifyRes] = await Promise.all([
      fetch(`${API_URL}/v1/proof/${proofId}/inspect`, {
        headers: { 'Accept': 'application/json' },
      }),
      fetch(`${API_URL}/v1/runproof/${proofId}/verify`, {
        headers: { 'Accept': 'application/json' },
      }),
    ])

    const inspectData = inspectRes.ok ? await inspectRes.json() : null
    const verifyData = verifyRes.ok ? await verifyRes.json() : null

    if (!inspectData && !verifyData) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: inspectRes.status }
      )
    }

    return NextResponse.json({
      inspect: inspectData,
      verify: verifyData,
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'Failed to fetch proof', detail: err },
      { status: 500 }
    )
  }
}