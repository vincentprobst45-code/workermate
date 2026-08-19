"use client"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Erreur lors de la connexion")
        return
      }
      await res.json()
      window.location.assign("/")
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setResetMessage("")
    setLoading(true)

    try {
      const res = await fetch("http://localhost:4000/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Erreur lors de la demande")
      setResetMessage(data.resetUrl ? `Lien de développement : ${data.resetUrl}` : data.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <main className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Se connecter</h2>
        {!showForgotPassword ? <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input className="w-full rounded-md border px-3 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full rounded-md border px-3 py-2" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button disabled={loading} className="rounded-full bg-slate-900 px-4 py-2 text-white disabled:opacity-50" type="submit">{loading ? 'Connexion...' : 'Se connecter'}</button>
          </div>
          <button type="button" className="text-sm text-slate-600 underline hover:text-slate-900" onClick={() => { setShowForgotPassword(true); setError("") }}>Mot de passe oublié ?</button>
        </form> : <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
          <p className="text-sm text-slate-600">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
          <input className="w-full rounded-md border px-3 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {resetMessage && <p className="break-all text-sm text-emerald-700">{resetMessage}</p>}
          <button disabled={loading} className="w-full rounded-full bg-slate-900 px-4 py-2 text-white disabled:opacity-50" type="submit">{loading ? 'Envoi...' : 'Envoyer le lien'}</button>
          <button type="button" className="text-sm text-slate-600 underline hover:text-slate-900" onClick={() => setShowForgotPassword(false)}>Retour à la connexion</button>
        </form>}
      </main>
    </div>
  )
}
