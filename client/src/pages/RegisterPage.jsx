import React, { useState } from 'react'
import api from '../lib/api'
import { UserPlus, Loader2, ArrowRight } from 'lucide-react'

export default function RegisterPage({ onSwitchToLogin, onAuthed }) {
  console.log('RegisterPage props:', { onSwitchToLogin, onAuthed });
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/users', { name, email, password })
      const token = res?.data?.token
      if (!token) throw new Error('No token returned')
      localStorage.setItem('token', token)
      onAuthed?.(res.data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800/60 border border-gray-700 rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
            <UserPlus className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold">Klarity • Create account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Name</label>
            <input
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-4 py-2 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Register</span>
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={() => {
            console.log('Sign in button clicked, onSwitchToLogin:', onSwitchToLogin);
            if (onSwitchToLogin) onSwitchToLogin();
          }} className="text-emerald-400 hover:underline">Sign in</button>
        </div>
      </div>
    </div>
  )
}
