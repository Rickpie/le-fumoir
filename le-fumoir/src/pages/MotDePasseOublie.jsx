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

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Mot de passe oublié</h1>

      {envoye ? (
        <div className="text-center py-10 rounded-xl" style={{ background: 'rgba(107,142,78,0.15)', border: '1px solid rgba(107,142,78,0.3)' }}>
          <p className="text-3xl mb-3">✓</p>
          <p className="text-sm" style={{ color: '#6B8E4E' }}>
            Un email avec un lien de réinitialisation a été envoyé à {email}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
          <p className="text-sm" style={{ color: '#FFFFFF' }}>
            Entrez votre email, vous recevrez un lien pour définir un nouveau mot de passe.
          </p>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: '#FFFFFF' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>

          {erreur && <p className="text-xs" style={{ color: '#B03A2E' }}>{erreur}</p>}

          <button type="submit" disabled={envoi}
            className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
            style={{ background: '#F0B429', color: '#1E1912', opacity: envoi ? 0.6 : 1 }}>
            {envoi ? 'Envoi...' : 'Envoyer le lien'}
          </button>

          <Link to="/connexion" className="text-xs text-center mt-2" style={{ color: '#FFFFFF' }}>
            ← Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  )
}

export default MotDePasseOublie
