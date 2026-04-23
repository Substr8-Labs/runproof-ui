'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProofPageData {
  inspect: InspectData | null
  verify: VerifyData | null
}

interface InspectData {
  run_id: string
  trace_id: string
  agent_id: string
  status: {
    proof_status: string
    indicator: { symbol: string; level: string; label: string }
    is_valid: boolean
    is_complete: boolean
    is_degraded: boolean
  }
  finalization: {
    reason: string
    capture_path: string
    enrichment_complete: boolean
    signals_present: string[]
    signals_missing: string[]
  }
  verification: {
    verified: boolean
    chain_valid: boolean
    signatures_valid: boolean
    signature_count: number
    signature_details: { signer_id: string; valid: boolean; timestamp: string }[]
    reason: string
  }
  bindings: {
    recall_refs: string[]
    memory_refs: string[]
    state_refs: string[]
    policy_refs: string[]
    recall_triggered: boolean
  }
  artifact: {
    version: string
    root_hash: string
    event_count: number
    created_at: string
    plugin_version: string | null
  }
}

interface VerifyData {
  run_id: string
  verified: boolean
  chain_valid: boolean
  signatures: {
    count: number
    all_valid: boolean
    results: { signer_id: string; valid: boolean; timestamp: string }[]
  }
  root_hash: string
  proof_spec_version: string
}

// ─── Policy Parser ───────────────────────────────────────────────────────────

interface ParsedPolicy {
  type: string // acc, dct, scope, etc.
  label: string // human-readable
  id: string
  rationale: string
  raw: string
}

const POLICY_TYPE_LABELS: Record<string, string> = {
  acc: 'Agent Capability Control',
  dct: 'Delegation Authority',
  scope: 'Scope Restriction',
  governance: 'Governance Policy',
}

function parsePolicyRef(ref: string): ParsedPolicy {
  // Format: "acc:governed_execution:within_envelope=true"
  const parts = ref.split(':')
  const type = parts[0] || 'unknown'
  const id = parts[1] || ref
  const rationale = parts[2] || ''
  const label = POLICY_TYPE_LABELS[type] || type.toUpperCase()

  return {
    type,
    label,
    id,
    rationale: rationale.replace(/_/g, ' '),
    raw: ref,
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProofPage() {
  const params = useParams()
  const proofId = params.id as string

  const [data, setData] = useState<ProofPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProof() {
      try {
        const res = await fetch(`/api/proof/${proofId}`)
        if (!res.ok) throw new Error('Proof not found')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load proof')
      } finally {
        setLoading(false)
      }
    }
    fetchProof()
  }, [proofId])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-xl animate-pulse">Loading proof...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ {error || 'Proof not found'}</div>
          <a href="/" className="text-blue-400 hover:underline">← Back to verify</a>
        </div>
      </div>
    )
  }

  const inspect = data.inspect
  const verifyData = data.verify
  const status = inspect?.status
  const verification = inspect?.verification
  const bindings = inspect?.bindings
  const artifact = inspect?.artifact
  const finalization = inspect?.finalization

  // Determine verdict
  const isValid = status?.is_valid ?? verifyData?.verified ?? false
  const isPartial = status?.is_degraded ?? false
  const verdict = isValid ? (isPartial ? 'partial' : 'valid') : 'failed'

  // Parse policies
  const policies = (bindings?.policy_refs || []).map(parsePolicyRef)
  const hasDeny = false // TODO: detect from policy data when available

  // Has lineage?
  const hasLineage = false // TODO: from inspect data when lineage fields available

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <div>
              <h1 className="text-lg font-bold">RunProof</h1>
              <p className="text-gray-500 text-xs font-mono">{proofId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(`https://runproof.substr8labs.com/proof/${proofId}`, 'link')}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copied === 'link' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* ─── Layer 1: Verification Verdict ────────────────────────────── */}
        <VerdictCard verdict={verdict} inspect={inspect} verifyData={verifyData} />

        {/* ─── Layer 2: Proof Summary Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Agent Identity */}
          {inspect && (
            <Card icon="👤" title="Agent Identity">
              <InfoRow label="Agent" value={inspect.agent_id} />
              <InfoRow label="Runtime" value={finalization?.reason || '-'} />
              <InfoRow label="Trace ID" value={inspect.trace_id} mono small />
              {verification?.signature_details?.[0] ? (
                <InfoRow
                  label="Signed by"
                  value={verification.signature_details[0].signer_id}
                  mono
                  small
                />
              ) : verifyData?.signatures?.results?.[0] ? (
                <InfoRow
                  label="Signed by"
                  value={verifyData.signatures.results[0].signer_id}
                  mono
                  small
                />
              ) : null}
            </Card>
          )}

          {/* Policy Governance */}
          {policies.length > 0 && (
            <Card icon="🛡️" title="Policy Governance">
              {policies.map((p, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-900 text-green-300">
                      ✅ ALLOW
                    </span>
                    <span className="text-sm text-gray-300">{p.id}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 ml-16">
                    {p.label} {p.rationale && `· ${p.rationale}`}
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
                {policies.length} policy{policies.length !== 1 ? 's' : ''} applied
              </div>
            </Card>
          )}

          {/* Artifact Hashes */}
          {artifact && (
            <Card icon="📎" title="Artifacts">
              {artifact.root_hash && (
                <HashRow
                  label="Root Hash"
                  value={artifact.root_hash}
                  copied={copied}
                  onCopy={() => copyToClipboard(artifact.root_hash, 'root')}
                />
              )}
              <InfoRow label="Spec Version" value={`v${artifact.version}`} />
              <InfoRow label="Created" value={formatDate(artifact.created_at)} />
              <InfoRow label="Events" value={String(artifact.event_count)} />
            </Card>
          )}

          {/* Signatures */}
          {(verification || verifyData) && (
            <Card icon="🔐" title="Signatures">
              <div className="flex items-center gap-2 mb-2">
                <span className={(verification?.chain_valid ?? verifyData?.chain_valid) ? 'text-green-400' : 'text-red-400'}>
                  {(verification?.chain_valid ?? verifyData?.chain_valid) ? '✅' : '❌'}
                </span>
                <span className="text-sm">
                  {(verification?.chain_valid ?? verifyData?.chain_valid) ? 'Hash chain valid' : 'Hash chain invalid'}
                </span>
              </div>
              <InfoRow label="Signatures" value={`${(verification?.signature_count ?? verifyData?.signatures?.count ?? 0)} (${(verification?.signatures_valid ?? verifyData?.signatures?.all_valid) ? 'all valid' : 'some invalid'})`} />
              {verifyData?.proof_spec_version && <div className="text-xs text-gray-500 mt-1">Spec v{verifyData.proof_spec_version}</div>}
            </Card>
          )}
        </div>

        {/* ─── Layer 3: Actions ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={`https://threadhq.io/runs/${inspect?.run_id || proofId}?proof=${proofId}&source=verify`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View in ThreadHQ
          </a>
          <button
            onClick={() => {
              const json = JSON.stringify(data, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${proofId}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </button>
          <button
            onClick={() => copyToClipboard(`https://runproof.substr8labs.com/proof/${proofId}`, 'share')}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {copied === 'share' ? 'Copied!' : 'Share Link'}
          </button>
        </div>

        {/* Advanced: Raw JSON */}
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${showRaw ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 6l8 4-8 4V6z" />
            </svg>
            Advanced: {showRaw ? 'Hide' : 'Show'} raw proof JSON
          </button>
          {showRaw && (
            <pre className="mt-3 bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-400 overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-4xl mx-auto text-center text-gray-600 text-xs">
          <p>
            <a href="https://docs.substr8labs.com" className="text-blue-500 hover:underline">Documentation</a>
            {' · '}
            <a href="https://docs.substr8labs.com/spec" className="text-blue-500 hover:underline">Specification</a>
            {' · '}
            <a href="https://github.com/Substr8-Labs" className="text-blue-500 hover:underline">GitHub</a>
          </p>
          <p className="mt-2">RunProof — Verify cryptographic proofs of AI agent execution</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function VerdictCard({ verdict, inspect, verifyData }: {
  verdict: 'valid' | 'partial' | 'failed'
  inspect: InspectData | null
  verifyData: VerifyData | null
}) {
  const config = {
    valid: { icon: '✅', label: 'Proof Verified', color: 'green', border: 'border-green-700', bg: 'bg-green-900/20' },
    partial: { icon: '⚠️', label: 'Proof Partial', color: 'amber', border: 'border-amber-700', bg: 'bg-amber-900/20' },
    failed: { icon: '❌', label: 'Proof Failed', color: 'red', border: 'border-red-700', bg: 'bg-red-900/20' },
  }[verdict]

  const status = inspect?.status
  const verification = inspect?.verification
  const artifact = inspect?.artifact

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-6`}>
      <div className="flex items-start gap-4">
        <span className="text-5xl">{config.icon}</span>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{config.label}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {verdict === 'valid' && 'All cryptographic checks passed'}
            {verdict === 'partial' && 'Proof is valid but degraded'}
            {verdict === 'failed' && 'Verification failed'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {inspect && (
              <>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Run</div>
                  <div className="font-mono text-sm mt-0.5">{inspect.run_id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Agent</div>
                  <div className="text-sm mt-0.5">{inspect.agent_id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Status</div>
                  <div className="text-sm mt-0.5">
                    {status?.indicator?.label || status?.proof_status || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Verified</div>
                  <div className="text-sm mt-0.5">
                    {formatDate(artifact?.created_at || (verification?.signature_details && verification.signature_details[0]?.timestamp) || verifyData?.signatures?.results?.[0]?.timestamp)}
                  </div>
                </div>
              </>
            )}
            {!inspect && verifyData && (
              <>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Run</div>
                  <div className="font-mono text-sm mt-0.5">{verifyData.run_id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Chain</div>
                  <div className="text-sm mt-0.5">{verifyData.chain_valid ? '✅ Valid' : '❌ Invalid'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase tracking-wide">Signatures</div>
                  <div className="text-sm mt-0.5">{verifyData.signatures.count} ({verifyData.signatures.all_valid ? 'all valid' : 'issues'})</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className={`${mono ? 'font-mono text-xs' : 'text-sm'} ${small ? 'text-xs' : ''} text-gray-200 break-all`}>
        {value || '-'}
      </div>
    </div>
  )
}

function HashRow({ label, value, copied, onCopy }: { label: string; value: string; copied: string | null; onCopy: () => void }) {
  const short = value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value
  return (
    <div className="mb-2 last:mb-0">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-gray-200">{short}</span>
        <button
          onClick={onCopy}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          title="Copy full hash"
        >
          {copied === 'root' ? (
            <span className="text-green-400 text-xs">✓</span>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}