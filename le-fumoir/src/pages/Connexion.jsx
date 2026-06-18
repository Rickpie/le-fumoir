import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Connexion() {
  const { seConnecter } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setChargement(true)
    setErreur('')
    const { error } = await seConnecter(email, motDePasse)
    if (error) {
      setErreur('Email ou mot de passe incorrect')
    } else {
      navigate('/')
    }
    setChargement(false)
  }

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Connexion</h1>

      {erreur && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1 font-medium" style={{ color: '#FFFFFF' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium" style={{ color: '#FFFFFF' }}>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={e => setMotDePasse(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="py-2 px-4 rounded-lg text-sm font-semibold transition-opacity"
          style={{ background: '#F0B429', color: '#1E1912', opacity: chargement ? 0.6 : 1 }}
        >
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>

        <Link to="/mot-de-passe-oublie" className="text-xs text-center" style={{ color: '#FFFFFF' }}>
          Mot de passe oublié ?
        </Link>
      </form>

      <p className="mt-4 text-sm" style={{ color: '#FFFFFF' }}>
        Pas encore de compte ?{' '}
        <Link to="/inscription" style={{ color: '#F0B429', fontWeight: 500 }}>S'inscrire</Link>
      </p>
    </div>
  )
}

export default Connexion
