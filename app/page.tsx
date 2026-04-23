// Build: 20260423040000
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const router = useRouter()
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_RUNPROOF_API_URL || 'https://runproof-api-production.up.railway.app'

  const handleVerify = async () => {
    if (!hash.trim()) return
    setLoading(true)
    setError('')

    try {
      // Try inspect endpoint first (richer data)
      const inspectRes = await fetch(`${API_URL}/v1/proof/${encodeURIComponent(hash.trim())}/inspect`)
      if (inspectRes.ok) {
        router.push(`/proof/${encodeURIComponent(hash.trim())}`)
        return
      }

      // Fallback: try verify endpoint
      const verifyRes = await fetch(`${API_URL}/v1/runproof/${encodeURIComponent(hash.trim())}/verify`)
      if (verifyRes.ok) {
        router.push(`/proof/${encodeURIComponent(hash.trim())}`)
        return
      }

      const data = await verifyRes.json().catch(() => null)
      setError(data?.detail || data?.error || 'Proof not found')
    } catch {
      setError('Failed to connect to verification service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">🔒</span>
            <h1 className="text-3xl font-bold">RunProof Verification</h1>
          </div>
          <p className="text-gray-400">Verify cryptographic proofs of AI agent execution</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Verify by Proof ID */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Verify by Proof ID</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="Enter proof ID (e.g. gov-test-1776636723)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={loading || !hash.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
        </section>

        {/* Upload File */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Or Upload RunProof File</h2>
          <FileUploader />
        </section>

        {/* How it works */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">How Verification Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">🔐</div>
              <div className="font-medium text-gray-300">Hash Chain</div>
              <div className="text-gray-500 mt-1">Every event is linked by cryptographic hash to the previous one</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✍️</div>
              <div className="font-medium text-gray-300">Signatures</div>
              <div className="text-gray-500 mt-1">Each proof is signed by the runtime that produced it</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🛡️</div>
              <div className="font-medium text-gray-300">Policy Governance</div>
              <div className="text-gray-500 mt-1">Proofs record which policies governed the execution</div>
            </div>
          </div>
        </section>

        <footer className="text-center text-gray-600 text-sm">
          <p>
            <a href="https://docs.substr8labs.com" className="text-blue-500 hover:underline">Documentation</a>
            {' · '}
            <a href="https://docs.substr8labs.com/spec" className="text-blue-500 hover:underline">Specification</a>
            {' · '}
            <a href="https://github.com/Substr8-Labs" className="text-blue-500 hover:underline">GitHub</a>
          </p>
        </footer>
      </main>
    </div>
  )
}

function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ valid: boolean; proof_id: string; run_id: string } | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      const content = await file.text()
      const proof = JSON.parse(content)

      const res = await fetch('/api/runproof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || data.error || 'Verification failed')
        setResult(null)
      } else {
        setResult(data)
        // Navigate to the proof page if we have an ID
        if (data.proof_id) {
          router.push(`/proof/${data.proof_id}`)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="file"
          accept=".json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600 file:transition-colors"
        />
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify File'}
        </button>
      </div>
      {error && (
        <div className="mt-3 bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  )
}