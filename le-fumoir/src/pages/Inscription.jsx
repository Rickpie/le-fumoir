import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import SEO from '../components/SEO'

function Inscription() {
  const { sInscrire } = useAuth()
  const navigate = useNavigate()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({
    email: '',
    motDePasse: '',
    prenom: '',
    nom: '',
    adresse: '',
    code_postal: '',
    telephone: '',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setChargement(true)
    setErreur('')
    const { error } = await sInscrire(form.email, form.motDePasse, {
      prenom: form.prenom,
      nom: form.nom,
      adresse: form.adresse,
      code_postal: form.code_postal,
      telephone: form.telephone,
    })
    if (error) {
      setErreur(error.message)
    } else {
      navigate('/')
    }
    setChargement(false)
  }

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  return (
    <div className="max-w-md mx-auto mt-10">
      <SEO titre="Créer un compte — PC Le Fumoir" noindex />
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Créer un compte</h1>

      {erreur && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1 font-medium" style={labelStyle}>Prénom</label>
            <input name="prenom" value={form.prenom} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1 font-medium" style={labelStyle}>Nom</label>
            <input name="nom" value={form.nom} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium" style={labelStyle}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium" style={labelStyle}>Mot de passe</label>
          <div className="relative">
            <input name="motDePasse" type={visible ? 'text' : 'password'} value={form.motDePasse} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none pr-10" style={inputStyle} />
            <button type="button" onClick={() => setVisible(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: '#7A6A50', background: 'none', border: 'none', cursor: 'pointer' }}>
              {visible ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium" style={labelStyle}>Adresse</label>
          <input name="adresse" value={form.adresse} onChange={handleChange} required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1 font-medium" style={labelStyle}>Code postal</label>
            <input name="code_postal" value={form.code_postal} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1 font-medium" style={labelStyle}>Téléphone</label>
            <input name="telephone" value={form.telephone} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="py-2 px-4 rounded-lg text-sm font-semibold transition-opacity"
          style={{ background: '#F0B429', color: '#1E1912', opacity: chargement ? 0.6 : 1 }}
        >
          {chargement ? 'Inscription...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-4 text-sm" style={{ color: '#FFFFFF' }}>
        Déjà un compte ?{' '}
        <Link to="/connexion" style={{ color: '#F0B429', fontWeight: 500 }}>Se connecter</Link>
      </p>
    </div>
  )
}

export default Inscription
