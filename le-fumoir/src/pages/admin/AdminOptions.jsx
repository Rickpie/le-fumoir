import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminOptions() {
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [chargement, setChargement] = useState(true)

  // Formulaires d'ajout
  const [nouvelleEpice, setNouvelleEpice] = useState({ nom: '', prix_supplement: '' })
  const [nouvelInsert, setNouvelInsert] = useState({ nom: '', prix_supplement: '' })

  useEffect(() => {
    chargerDonnees()
  }, [])

async function chargerDonnees() {
  const { data: e } = await supabase.from('epices').select('*')
  const { data: i } = await supabase.from('inserts').select('*')

  const trier = (liste) => (liste || []).sort((a, b) =>
    a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
  )

  setEpices(trier(e))
  setInserts(trier(i))
  setChargement(false)
}

  async function ajouterEpice(e) {
    e.preventDefault()
    if (!nouvelleEpice.nom) return
    await supabase.from('epices').insert({
      nom: nouvelleEpice.nom,
      prix_supplement: parseFloat(nouvelleEpice.prix_supplement) || 0,
    })
    setNouvelleEpice({ nom: '', prix_supplement: '' })
    chargerDonnees()
  }

  async function ajouterInsert(e) {
    e.preventDefault()
    if (!nouvelInsert.nom) return
    await supabase.from('inserts').insert({
      nom: nouvelInsert.nom,
      prix_supplement: parseFloat(nouvelInsert.prix_supplement) || 0,
    })
    setNouvelInsert({ nom: '', prix_supplement: '' })
    chargerDonnees()
  }

  async function toggleVisibilite(table, id, visibleActuel) {
    await supabase.from(table).update({ visible: !visibleActuel }).eq('id', id)
    chargerDonnees()
  }

  async function supprimer(table, id) {
    if (!confirm('Supprimer définitivement cet élément ?')) return
    await supabase.from(table).delete().eq('id', id)
    chargerDonnees()
  }

  if (chargement) return <p style={{ color: '#7a4010' }}>Chargement...</p>

  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* ÉPICES */}
      <div>
        <h2 className="text-lg font-medium mb-3" style={{ color: '#3d1e06' }}>🧂 Épices</h2>

        <form onSubmit={ajouterEpice} className="flex gap-2 mb-4">
          <input
            placeholder="Nom (ex: Piment d'Espelette)"
            value={nouvelleEpice.nom}
            onChange={e => setNouvelleEpice({ ...nouvelleEpice, nom: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <input
            placeholder="Prix +€"
            type="number"
            step="0.01"
            value={nouvelleEpice.prix_supplement}
            onChange={e => setNouvelleEpice({ ...nouvelleEpice, prix_supplement: e.target.value })}
            className="w-24 px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
            Ajouter
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {epices.map(epice => (
            <div key={epice.id} className="flex items-center justify-between bg-white rounded-lg p-3 border"
              style={{ borderColor: '#d6bfa0', opacity: epice.visible ? 1 : 0.5 }}>
              <div>
                <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{epice.nom}</span>
                <span className="text-xs ml-2" style={{ color: '#b06010' }}>+{epice.prix_supplement} €</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleVisibilite('epices', epice.id, epice.visible)}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: '#f5e2c0', color: '#7a4010' }}>
                  {epice.visible ? 'Cacher' : 'Afficher'}
                </button>
                <button onClick={() => supprimer('epices', epice.id)}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: '#fde8e8', color: '#c0392b' }}>
                  Suppr.
                </button>
              </div>
            </div>
          ))}
          {epices.length === 0 && <p className="text-sm" style={{ color: '#a07050' }}>Aucune épice pour l'instant.</p>}
        </div>
      </div>

      {/* INSERTS */}
      <div>
        <h2 className="text-lg font-medium mb-3" style={{ color: '#3d1e06' }}>🧀 Inserts</h2>

        <form onSubmit={ajouterInsert} className="flex gap-2 mb-4">
          <input
            placeholder="Nom (ex: Foie gras)"
            value={nouvelInsert.nom}
            onChange={e => setNouvelInsert({ ...nouvelInsert, nom: e.target.value })}
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <input
            placeholder="Prix +€"
            type="number"
            step="0.01"
            value={nouvelInsert.prix_supplement}
            onChange={e => setNouvelInsert({ ...nouvelInsert, prix_supplement: e.target.value })}
            className="w-24 px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
            Ajouter
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {inserts.map(insert => (
            <div key={insert.id} className="flex items-center justify-between bg-white rounded-lg p-3 border"
              style={{ borderColor: '#d6bfa0', opacity: insert.visible ? 1 : 0.5 }}>
              <div>
                <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{insert.nom}</span>
                <span className="text-xs ml-2" style={{ color: '#b06010' }}>+{insert.prix_supplement} €</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleVisibilite('inserts', insert.id, insert.visible)}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: '#f5e2c0', color: '#7a4010' }}>
                  {insert.visible ? 'Cacher' : 'Afficher'}
                </button>
                <button onClick={() => supprimer('inserts', insert.id)}
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ background: '#fde8e8', color: '#c0392b' }}>
                  Suppr.
                </button>
              </div>
            </div>
          ))}
          {inserts.length === 0 && <p className="text-sm" style={{ color: '#a07050' }}>Aucun insert pour l'instant.</p>}
        </div>
      </div>

    </div>
  )
}

export default AdminOptions