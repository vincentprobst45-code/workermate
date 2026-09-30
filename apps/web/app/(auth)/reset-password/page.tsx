'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:4000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Lien invalide ou expiré.')
      setMessage(data.message)
      setPassword('')
      setConfirmation('')
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <main className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-slate-600">Utilisez au moins 12 caractères, avec une majuscule, une minuscule et un chiffre.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input className="w-full rounded-md border px-3 py-2" type="password" minLength={12} placeholder="Nouveau mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <input className="w-full rounded-md border px-3 py-2" type="password" minLength={12} placeholder="Confirmer le mot de passe" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          <button disabled={loading || !token} className="w-full rounded-full bg-slate-900 px-4 py-2 text-white disabled:opacity-50" type="submit">{loading ? 'Modification...' : 'Modifier le mot de passe'}</button>
        </form>
      </main>
    </div>
  )
}
