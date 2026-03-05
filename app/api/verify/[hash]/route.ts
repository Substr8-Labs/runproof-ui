import { NextRequest, NextResponse } from 'next/server'

// In production, this would query a database of registered RunProofs
// For now, return mock data for demo purposes

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash

  // Strip sha256: prefix if present
  const cleanHash = hash.replace(/^sha256:/, '')

  // TODO: Query actual RunProof registry
  // For demo, return verified result for any hash
  
  if (cleanHash.length < 8) {
    return NextResponse.json(
      { error: 'Invalid hash format' },
      { status: 400 }
    )
  }

  // Simulated verification result
  const result = {
    verified: true,
    runId: `run-${cleanHash.slice(0, 6)}`,
    agent: 'langgraph:researcher',
    policyHash: `sha256:${cleanHash.slice(0, 12)}...`,
    ledgerStatus: 'chain valid',
    ciaReceipts: 'present (12 entries)',
    memoryProvenance: 'verified',
    timestamp: new Date().toISOString(),
    rootHash: `sha256:${cleanHash}`,
  }

  return NextResponse.json(result)
}
