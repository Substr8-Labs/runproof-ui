'use client'

import { useState } from 'react'

interface VerificationResult {
  verified: boolean
  runId: string
  agent: string
  policyHash: string
  ledgerStatus: string
  ciaReceipts: string
  memoryProvenance: string
  timestamp: string
  rootHash: string
}

export default function VerifyPage() {
  const [hash, setHash] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerifyHash = async () => {
    if (!hash.trim()) return
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(hash.trim())}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('runproof', file)
      
      const res = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError('Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="https://substr8labs.com" className="text-xl font-bold">
            Substr8
          </a>
          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="https://docs.substr8labs.com" className="hover:text-white">Docs</a>
            <a href="https://github.com/Substr8-Labs" className="hover:text-white">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Verify RunProof</h1>
          <p className="text-gray-400 mb-8">
            Cryptographically verify AI agent runs. Upload a RunProof artifact or enter a hash.
          </p>

          {/* Hash Input */}
          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">Verify by hash</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="sha256:7afc3e..."
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 font-mono text-sm"
              />
              <button
                onClick={handleVerifyHash}
                disabled={loading || !hash.trim()}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Verify
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 border-t border-gray-800"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-800"></div>
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">Upload RunProof</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
              <input
                type="file"
                accept=".tgz,.tar.gz,.zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="font-mono text-green-400">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400">Drop a .runproof.tgz file or click to browse</p>
                    <p className="text-sm text-gray-600 mt-1">Supports .tgz, .tar.gz, .zip</p>
                  </div>
                )}
              </label>
            </div>
            {file && (
              <button
                onClick={handleFileUpload}
                disabled={loading}
                className="mt-4 w-full px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify RunProof'}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 bg-red-900/30 border border-red-800 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-6 rounded-lg border ${result.verified ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.verified ? 'bg-green-600' : 'bg-red-600'}`}>
                  {result.verified ? '✓' : '✗'}
                </div>
                <h2 className="text-xl font-bold">
                  {result.verified ? 'RunProof Verified' : 'Verification Failed'}
                </h2>
              </div>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Run ID</span>
                  <span>{result.runId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Agent</span>
                  <span>{result.agent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Policy</span>
                  <span className="text-green-400">{result.policyHash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ledger</span>
                  <span className="text-green-400">{result.ledgerStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CIA Receipts</span>
                  <span className="text-green-400">{result.ciaReceipts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory Provenance</span>
                  <span className="text-green-400">{result.memoryProvenance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timestamp</span>
                  <span>{result.timestamp}</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <span className="text-gray-400">Root Hash</span>
                  <p className="mt-1 break-all text-xs">{result.rootHash}</p>
                </div>
              </div>

              {/* Badge */}
              {result.verified && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Add badge to your README:</p>
                  <code className="block bg-gray-900 p-3 rounded text-xs break-all">
                    ![Verified by Substr8](https://verify.substr8labs.com/badge/{result.rootHash.slice(0, 16)})
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>Substr8 — Governance infrastructure for AI agents</p>
          <p className="mt-1">© 2026 Substr8 Labs</p>
        </div>
      </footer>
    </div>
  )
}
