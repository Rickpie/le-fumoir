import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function ReinitialiserMotDePasse() {
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!succes) return
    const t = setTimeout(() => navigate('/'), 2000)
    return () => clearTimeout(t)
  }, [succes])

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')

    if (motDePasse !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setEnvoi(true)
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    setEnvoi(false)

    if (error) {
      setErreur(error.message)
    } else {
      setSucces(true)
    }
  }

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Nouveau mot de passe</h1>

      {succes ? (
        <div className="text-center py-10 rounded-xl" style={{ background: 'rgba(107,142,78,0.15)', border: '1px solid rgba(107,142,78,0.3)' }}>
          <p className="text-3xl mb-3">✓</p>
          <p className="text-sm" style={{ color: '#6B8E4E' }}>Mot de passe mis à jour ! Redirection...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Nouveau mot de passe</label>
            <input type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Confirmer le mot de passe</label>
            <input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          {erreur && <p className="text-xs" style={{ color: '#B03A2E' }}>{erreur}</p>}

          <button type="submit" disabled={envoi}
            className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
            style={{ background: '#F0B429', color: '#1E1912', opacity: envoi ? 0.6 : 1 }}>
            {envoi ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      )}
    </div>
  )
}

export default ReinitialiserMotDePasse
