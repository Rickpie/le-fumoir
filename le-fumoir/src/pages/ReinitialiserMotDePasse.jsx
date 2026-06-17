import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function ReinitialiserMotDePasse() {
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const navigate = useNavigate()

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
      setTimeout(() => navigate('/'), 2000)
    }
  }

  const labelStyle = { color: '#7a4010' }
  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Nouveau mot de passe</h1>

      {succes ? (
        <div className="text-center py-10 rounded-xl" style={{ background: '#eaf3de' }}>
          <p className="text-3xl mb-3">✓</p>
          <p className="text-sm" style={{ color: '#3B6D11' }}>Mot de passe mis à jour ! Redirection...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: '#d6bfa0' }}>
          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Nouveau mot de passe</label>
            <input type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Confirmer le mot de passe</label>
            <input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          {erreur && <p className="text-xs" style={{ color: '#c0392b' }}>{erreur}</p>}

          <button type="submit" disabled={envoi}
            className="px-4 py-2 rounded-lg text-sm font-medium self-start"
            style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
            {envoi ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      )}
    </div>
  )
}

export default ReinitialiserMotDePasse