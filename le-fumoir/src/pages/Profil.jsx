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

  const labelStyle = { color: '#FFFFFF' }
  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-medium mb-6" style={{ color: '#EDD98A' }}>Mon profil</h1>

      <form onSubmit={enregistrer} className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: '#2C2518', borderColor: '#4A3820' }}>
        <div>
          <label className="block text-xs mb-1 font-medium" style={labelStyle}>Email</label>
          <input value={utilisateur?.email || ''} disabled
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none opacity-50"
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
          <p className="text-xs" style={{ color: '#6B8E4E' }}>✓ Profil mis à jour</p>
        )}

        <button type="submit" disabled={enregistrement}
          className="px-4 py-2 rounded-lg text-sm font-semibold self-start transition-opacity"
          style={{ background: '#F0B429', color: '#1E1912', opacity: enregistrement ? 0.6 : 1 }}>
          {enregistrement ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

export default Profil
