import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Verify | Substr8',
  description: 'Verify AI agent runs with cryptographic proof',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
// Deployed 2026-03-11
