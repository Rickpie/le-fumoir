import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Inscription() {
  const { sInscrire } = useAuth()
  const navigate = useNavigate()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
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

  const inputStyle = {
    borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06'
  }
  const labelStyle = { color: '#7a4010' }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Créer un compte</h1>

      {erreur && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fde8e8', color: '#c0392b' }}>
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
          <input name="motDePasse" type="password" value={form.motDePasse} onChange={handleChange} required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
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
          className="py-2 px-4 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}
        >
          {chargement ? 'Inscription...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-4 text-sm" style={{ color: '#7a4010' }}>
        Déjà un compte ?{' '}
        <Link to="/connexion" style={{ color: '#5a2e0e', fontWeight: 500 }}>Se connecter</Link>
      </p>
    </div>
  )
}

export default Inscription