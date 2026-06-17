import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setEnvoi(true)
    setErreur('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    })

    if (error) {
      setErreur(error.message)
    } else {
      setEnvoye(true)
    }
    setEnvoi(false)
  }

  const labelStyle = { color: '#7a4010' }
  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Mot de passe oublié</h1>

      {envoye ? (
        <div className="text-center py-10 rounded-xl" style={{ background: '#eaf3de' }}>
          <p className="text-3xl mb-3">✓</p>
          <p className="text-sm" style={{ color: '#3B6D11' }}>
            Un email avec un lien de réinitialisation a été envoyé à {email}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: '#d6bfa0' }}>
          <p className="text-sm" style={{ color: '#7a4010' }}>
            Entrez votre email, vous recevrez un lien pour définir un nouveau mot de passe.
          </p>

          <div>
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          {erreur && <p className="text-xs" style={{ color: '#c0392b' }}>{erreur}</p>}

          <button type="submit" disabled={envoi}
            className="px-4 py-2 rounded-lg text-sm font-medium self-start"
            style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
            {envoi ? 'Envoi...' : 'Envoyer le lien'}
          </button>

          <Link to="/connexion" className="text-xs text-center mt-2" style={{ color: '#a07050' }}>
            ← Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  )
}

export default MotDePasseOublie