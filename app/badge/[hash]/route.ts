import { NextRequest, NextResponse } from 'next/server'

// SVG badge generator for RunProof verification
// Usage: ![Verified](https://verify.substr8labs.com/badge/<hash>)

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash
  
  // TODO: Actually verify the hash against registry
  // For now, always show verified
  const verified = true
  
  const svg = verified
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20">
        <linearGradient id="b" x2="0" y2="100%">
          <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
          <stop offset="1" stop-opacity=".1"/>
        </linearGradient>
        <clipPath id="a">
          <rect width="140" height="20" rx="3" fill="#fff"/>
        </clipPath>
        <g clip-path="url(#a)">
          <path fill="#555" d="M0 0h63v20H0z"/>
          <path fill="#4c1" d="M63 0h77v20H63z"/>
          <path fill="url(#b)" d="M0 0h140v20H0z"/>
        </g>
        <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
          <text x="31.5" y="15" fill="#010101" fill-opacity=".3">Substr8</text>
          <text x="31.5" y="14">Substr8</text>
          <text x="100.5" y="15" fill="#010101" fill-opacity=".3">verified ✓</text>
          <text x="100.5" y="14">verified ✓</text>
        </g>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20">
        <linearGradient id="b" x2="0" y2="100%">
          <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
          <stop offset="1" stop-opacity=".1"/>
        </linearGradient>
        <clipPath id="a">
          <rect width="140" height="20" rx="3" fill="#fff"/>
        </clipPath>
        <g clip-path="url(#a)">
          <path fill="#555" d="M0 0h63v20H0z"/>
          <path fill="#e05d44" d="M63 0h77v20H63z"/>
          <path fill="url(#b)" d="M0 0h140v20H0z"/>
        </g>
        <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
          <text x="31.5" y="15" fill="#010101" fill-opacity=".3">Substr8</text>
          <text x="31.5" y="14">Substr8</text>
          <text x="100.5" y="15" fill="#010101" fill-opacity=".3">unverified</text>
          <text x="100.5" y="14">unverified</text>
        </g>
      </svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    },
  })
}
