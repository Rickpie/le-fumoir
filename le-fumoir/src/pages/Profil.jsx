import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'

function Profil() {
  const { profil, utilisateur } = useAuth()

  const [prenom, setPrenom] = useState(profil?.prenom || '')
  const [nom, setNom] = useState(profil?.nom || '')
  const [adresse, setAdresse] = useState(profil?.adresse || '')
  const [codePostal, setCodePostal] = useState(profil?.code_postal || '')
  const [telephone, setTelephone] = useState(profil?.telephone || '')

  const [enregistrement, setEnregistrement] = useState(false)
  const [succes, setSucces] = useState(false)

  async function enregistrer(e) {
    e.preventDefault()
    setEnregistrement(true)
    setSucces(false)

    await supabase.from('profils').update({
      prenom,
      nom,
      adresse,
      code_postal: codePostal,
      telephone,
    }).eq('id', utilisateur.id)

    setEnregistrement(false)
    setSucces(true)
    setTimeout(() => setSucces(false), 3000)
  }

  const labelStyle = { color: '#7a4010' }
  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#3d1e06' }}>Mon profil</h1>

      <form onSubmit={enregistrer} className="bg-white rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: '#d6bfa0' }}>
        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Email</label>
          <input value={utilisateur?.email || ''} disabled
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none opacity-60"
            style={inputStyle} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Prénom</label>
            <input value={prenom} onChange={e => setPrenom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Nom</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Adresse</label>
          <input value={adresse} onChange={e => setAdresse(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Code postal</label>
            <input value={codePostal} onChange={e => setCodePostal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1 font-medium" style={labelStyle}>Téléphone</label>
            <input value={telephone} onChange={e => setTelephone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        {succes && (
          <p className="text-xs" style={{ color: '#3B6D11' }}>✓ Profil mis à jour</p>
        )}

        <button type="submit" disabled={enregistrement}
          className="px-4 py-2 rounded-lg text-sm font-medium self-start"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

export default Profil