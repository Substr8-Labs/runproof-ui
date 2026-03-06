import { NextRequest, NextResponse } from 'next/server'

const MCP_URL = process.env.MCP_URL || 'https://mcp.substr8labs.com'

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash

  // Strip sha256: prefix if present
  const cleanHash = hash.replace(/^sha256:/, '')

  if (cleanHash.length < 8) {
    return NextResponse.json(
      { error: 'Invalid hash format' },
      { status: 400 }
    )
  }

  try {
    // Try to verify via MCP server
    const mcpResponse = await fetch(`${MCP_URL}/tools/verify.run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id: cleanHash }),
    })

    if (mcpResponse.ok) {
      const mcpData = await mcpResponse.json()
      
      return NextResponse.json({
        verified: mcpData.valid ?? true,
        runId: mcpData.run_id || `run-${cleanHash.slice(0, 6)}`,
        agent: mcpData.agent_ref || 'unknown',
        policyHash: mcpData.policy_hash || 'not recorded',
        ledgerStatus: mcpData.ledger_valid ? 'chain valid' : 'unverified',
        ciaReceipts: mcpData.cia_receipt_count ? `present (${mcpData.cia_receipt_count} entries)` : 'not recorded',
        memoryProvenance: mcpData.gam_pointer_count ? 'verified' : 'not recorded',
        timestamp: mcpData.timestamp || new Date().toISOString(),
        rootHash: `sha256:${cleanHash}`,
      })
    }
  } catch (error) {
    // MCP not available, fall back to local verification
    console.log('MCP verification failed, using local fallback:', error)
  }

  // Fallback: Return unverified if not found in registry
  // In production, this would return 404 for unknown hashes
  // For now, return a "not registered" response
  return NextResponse.json({
    verified: false,
    runId: `run-${cleanHash.slice(0, 6)}`,
    agent: 'unknown',
    policyHash: 'not registered',
    ledgerStatus: 'not found in registry',
    ciaReceipts: 'not found',
    memoryProvenance: 'not found',
    timestamp: new Date().toISOString(),
    rootHash: `sha256:${cleanHash}`,
    error: 'RunProof not found in registry. Upload to verify.',
  })
}
