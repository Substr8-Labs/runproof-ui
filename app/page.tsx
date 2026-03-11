'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VerificationResult {
  valid: boolean
  proof_id: string
  run_id: string
  agent_id: string
  runtime: string
  status: string
  event_count: number
}

export default function VerifyPage() {
  const router = useRouter()
  const [hash, setHash] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_RUNPROOF_API_URL || ''

  const handleVerifyHash = async () => {
    if (!hash.trim()) return
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/verify/${encodeURIComponent(hash.trim())}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('Failed to connect to verification service')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      const content = await file.text()
      const proof = JSON.parse(content)
      
      const res = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('Invalid JSON file or verification failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const viewFullProof = () => {
    if (result?.proof_id) {
      router.push(`/proof/${result.proof_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">RunProof Verification</h1>
          <p className="text-gray-400">Verify cryptographic proofs of AI agent execution</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Verify by Hash */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Verify by Proof ID</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="proof_abc123..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400"
            />
            <button
              onClick={handleVerifyHash}
              disabled={loading || !hash.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </section>

        {/* Upload File */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Or Upload RunProof File</h2>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white hover:file:bg-gray-500"
            />
            <button
              onClick={handleFileUpload}
              disabled={loading || !file}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify File'}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <section className={`p-6 rounded-lg border ${
            result.valid 
              ? 'bg-green-900/30 border-green-700' 
              : 'bg-red-900/30 border-red-700'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{result.valid ? '✅' : '❌'}</span>
                <div>
                  <h3 className="text-xl font-bold">
                    {result.valid ? 'Valid RunProof' : 'Invalid RunProof'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {result.valid ? 'All cryptographic checks passed' : 'Verification failed'}
                  </p>
                </div>
              </div>
              <button
                onClick={viewFullProof}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                View Full Details →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Proof ID</span>
                <div className="font-mono">{result.proof_id}</div>
              </div>
              <div>
                <span className="text-gray-400">Run ID</span>
                <div className="font-mono">{result.run_id}</div>
              </div>
              <div>
                <span className="text-gray-400">Agent</span>
                <div>{result.agent_id}</div>
              </div>
              <div>
                <span className="text-gray-400">Runtime</span>
                <div>{result.runtime}</div>
              </div>
              <div>
                <span className="text-gray-400">Status</span>
                <div>{result.status}</div>
              </div>
              <div>
                <span className="text-gray-400">Events</span>
                <div>{result.event_count}</div>
              </div>
            </div>
          </section>
        )}

        {/* Links */}
        <footer className="text-center text-gray-500 text-sm">
          <p>
            <a href="https://docs.substr8labs.com" className="text-blue-400 hover:underline">Documentation</a>
            {' • '}
            <a href="https://docs.substr8labs.com/spec" className="text-blue-400 hover:underline">Specification</a>
            {' • '}
            <a href="https://github.com/Substr8-Labs" className="text-blue-400 hover:underline">GitHub</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
