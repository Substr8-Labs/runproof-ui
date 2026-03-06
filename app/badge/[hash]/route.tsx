import { NextRequest, NextResponse } from 'next/server'

const MCP_URL = process.env.MCP_URL || 'https://mcp.substr8labs.com'

// SVG badge templates
function createBadge(status: 'verified' | 'unverified' | 'unknown', label: string = 'Substr8') {
  const colors = {
    verified: '#22c55e',   // green
    unverified: '#ef4444', // red
    unknown: '#6b7280',    // gray
  }
  
  const statusText = {
    verified: 'verified',
    unverified: 'failed',
    unknown: 'unknown',
  }

  const color = colors[status]
  const text = statusText[status]
  const labelWidth = 50
  const statusWidth = status === 'verified' ? 52 : status === 'unverified' ? 42 : 54
  const totalWidth = labelWidth + statusWidth

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${text}">
  <title>${label}: ${text}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${statusWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth/2}" y="14">${label}</text>
    <text x="${labelWidth + statusWidth/2}" y="14">${text}</text>
  </g>
</svg>`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash.replace(/\.svg$/, '').replace(/^sha256:/, '')

  if (hash.length < 8) {
    const svg = createBadge('unknown')
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    })
  }

  let status: 'verified' | 'unverified' | 'unknown' = 'unknown'

  try {
    const mcpResponse = await fetch(`${MCP_URL}/tools/verify.run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_id: hash }),
    })

    if (mcpResponse.ok) {
      const data = await mcpResponse.json()
      status = data.valid ? 'verified' : 'unverified'
    }
  } catch (error) {
    // MCP not available, return unknown
    console.log('Badge verification failed:', error)
  }

  const svg = createBadge(status)
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300', // Cache 5 min
    },
  })
}
