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

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Connexion</h1>

      {erreur && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fde8e8', color: '#c0392b' }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1 font-medium" style={{ color: '#7a4010' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium" style={{ color: '#7a4010' }}>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={e => setMotDePasse(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }}
          />
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="py-2 px-4 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}
        >
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-4 text-sm" style={{ color: '#7a4010' }}>
        Pas encore de compte ?{' '}
        <Link to="/inscription" style={{ color: '#5a2e0e', fontWeight: 500 }}>S'inscrire</Link>
      </p>
    </div>
  )
}

export default Connexion