'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// Types for the 4 views
interface Summary {
  proof_id: string
  run_id: string
  agent_id: string
  runtime: string
  status: string
  valid: boolean
  event_count: number
  started_at: string
  ended_at: string
}

interface TimelineEvent {
  seq: number
  type: string
  timestamp: string
  entry_hash: string
  payload?: Record<string, unknown>
}

interface Timeline {
  events: TimelineEvent[]
  total_events: number
}

interface Lineage {
  proof_id: string
  parent: string | null
  root: string | null
  depth: number
  workflow_id: string | null
  children: string[]
}

interface ReportCheck {
  name: string
  passed: boolean
  details: string
}

interface Report {
  valid: boolean
  checks: ReportCheck[]
  human_summary: string
  technical_summary: string
}

interface AllViews {
  summary: Summary
  timeline: Timeline
  lineage: Lineage
  report: Report
}

type Tab = 'summary' | 'timeline' | 'lineage' | 'report'

export default function ProofPage() {
  const params = useParams()
  const proofId = params.id as string
  
  const [data, setData] = useState<AllViews | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [technicalMode, setTechnicalMode] = useState(false)

  useEffect(() => {
    async function fetchProof() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_RUNPROOF_API_URL || 'http://localhost:8000'
        const res = await fetch(`${API_URL}/proof/${proofId}`)
        if (!res.ok) {
          throw new Error('Proof not found')
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading proof...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error || 'Proof not found'}</div>
          <a href="/" className="text-blue-400 hover:underline">← Back to verify</a>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'summary', label: 'Summary', icon: '✓' },
    { id: 'timeline', label: 'Timeline', icon: '📋' },
    { id: 'lineage', label: 'Lineage', icon: '🌳' },
    { id: 'report', label: 'Report', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">RunProof Verification</h1>
            <p className="text-gray-400 text-sm font-mono">{proofId}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={technicalMode}
                onChange={(e) => setTechnicalMode(e.target.checked)}
                className="rounded"
              />
              Technical Mode
            </label>
            <a href="/" className="text-blue-400 hover:underline text-sm">
              ← Verify Another
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-green-500 text-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'summary' && <SummaryView data={data.summary} />}
        {activeTab === 'timeline' && <TimelineView data={data.timeline} technical={technicalMode} />}
        {activeTab === 'lineage' && <LineageView data={data.lineage} />}
        {activeTab === 'report' && <ReportView data={data.report} technical={technicalMode} />}
      </main>
    </div>
  )
}

// Summary View Component
function SummaryView({ data }: { data: Summary }) {
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`p-6 rounded-lg ${data.valid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{data.valid ? '✅' : '❌'}</span>
          <div>
            <h2 className="text-2xl font-bold">{data.valid ? 'Valid RunProof' : 'Invalid RunProof'}</h2>
            <p className="text-gray-400">
              {data.valid ? 'All cryptographic checks passed' : 'Verification failed'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailCard label="Proof ID" value={data.proof_id} mono />
        <DetailCard label="Run ID" value={data.run_id} mono />
        <DetailCard label="Agent" value={data.agent_id} />
        <DetailCard label="Runtime" value={data.runtime} />
        <DetailCard label="Status" value={data.status} />
        <DetailCard label="Events" value={data.event_count.toString()} />
        <DetailCard label="Started" value={new Date(data.started_at).toLocaleString()} />
        <DetailCard label="Ended" value={data.ended_at ? new Date(data.ended_at).toLocaleString() : '-'} />
      </div>
    </div>
  )
}

// Timeline View Component
function TimelineView({ data, technical }: { data: Timeline; technical: boolean }) {
  return (
    <div className="space-y-4">
      <div className="text-gray-400 text-sm">{data.total_events} events</div>
      <div className="space-y-2">
        {data.events.map((event, i) => (
          <div
            key={i}
            className="bg-gray-800 p-4 rounded-lg flex items-start gap-4"
          >
            <span className="bg-gray-700 px-2 py-1 rounded text-sm font-mono">
              #{event.seq}
            </span>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-medium text-green-400">{event.type}</span>
                <span className="text-gray-500 text-sm">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {technical && event.entry_hash && (
                <div className="text-gray-500 text-xs font-mono mt-1">
                  {event.entry_hash.substring(0, 40)}...
                </div>
              )}
              {event.payload && (
                <pre className="text-gray-400 text-xs mt-2 bg-gray-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Lineage View Component
function LineageView({ data }: { data: Lineage }) {
  return (
    <div className="space-y-6">
      {/* Current Proof */}
      <div className="bg-gray-800 p-4 rounded-lg border-2 border-green-600">
        <div className="text-sm text-gray-400">Current Proof</div>
        <div className="font-mono text-green-400">{data.proof_id}</div>
        <div className="text-sm text-gray-500 mt-1">Depth: {data.depth}</div>
      </div>

      {/* Tree Structure */}
      <div className="space-y-4">
        {data.root && (
          <div className="ml-4">
            <div className="text-gray-400 text-sm">Root</div>
            <div className="bg-gray-800 p-3 rounded font-mono text-sm">{data.root}</div>
          </div>
        )}
        
        {data.parent && (
          <div className="ml-8">
            <div className="text-gray-400 text-sm">↑ Parent</div>
            <div className="bg-gray-800 p-3 rounded font-mono text-sm">{data.parent}</div>
          </div>
        )}

        {data.workflow_id && (
          <div className="mt-4">
            <div className="text-gray-400 text-sm">Workflow ID</div>
            <div className="bg-gray-800 p-3 rounded font-mono text-sm">{data.workflow_id}</div>
          </div>
        )}

        {data.children.length > 0 && (
          <div className="ml-8 mt-4">
            <div className="text-gray-400 text-sm">↓ Children ({data.children.length})</div>
            {data.children.map((child, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded font-mono text-sm mt-2">
                {child}
              </div>
            ))}
          </div>
        )}

        {!data.parent && !data.root && data.children.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            This is a standalone proof with no lineage.
          </div>
        )}
      </div>
    </div>
  )
}

// Report View Component
function ReportView({ data, technical }: { data: Report; technical: boolean }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className={`p-4 rounded-lg ${data.valid ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
        <p className="text-lg">
          {technical ? data.technical_summary : data.human_summary}
        </p>
      </div>

      {/* Checks */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Verification Checks</h3>
        {data.checks.map((check, i) => (
          <div
            key={i}
            className="bg-gray-800 p-4 rounded-lg flex items-center gap-4"
          >
            <span className="text-2xl">{check.passed ? '✅' : '❌'}</span>
            <div className="flex-1">
              <div className="font-medium">{check.name}</div>
              <div className="text-gray-400 text-sm">{check.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper Component
function DetailCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className={`text-white ${mono ? 'font-mono text-sm' : ''}`}>{value}</div>
    </div>
  )
}
