'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/')
    } else {
      setError('Wrong password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDFAF5' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: '#F47920' }}>
            <span className="text-white text-2xl font-black">OJ</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>OJ Sippin</h1>
          <p className="text-sm mt-1" style={{ color: '#6B6560' }}>Business Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-8 space-y-4" style={{ borderColor: '#E8E2D9' }}>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              className="w-full border rounded-xl px-4 py-3 text-base outline-none transition-all"
              style={{ borderColor: error ? '#ef4444' : '#E8E2D9' }}
              onFocus={e => e.target.style.borderColor = '#F47920'}
              onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#E8E2D9'}
            />
            {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full text-white font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50"
            style={{ background: '#F47920' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#6B6560' }}>Hype By Nature 🍊</p>
      </div>
    </div>
  )
}
