"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../auth.context"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Erreur lors de la connexion")
        return
      }
      const data = await res.json()
      login(data.accessToken, data.refreshToken, data.user, data.memberships)
      router.push("/")
    } catch {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <main className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Se connecter</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input className="w-full rounded-md border px-3 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full rounded-md border px-3 py-2" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button disabled={loading} className="rounded-full bg-slate-900 px-4 py-2 text-white disabled:opacity-50" type="submit">{loading ? 'Connexion...' : 'Se connecter'}</button>
          </div>
        </form>
      </main>
    </div>
  )
}
