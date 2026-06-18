import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminOptions() {
  const [epices, setEpices] = useState([])
  const [inserts, setInserts] = useState([])
  const [chargement, setChargement] = useState(true)

  const [nouvelleEpice, setNouvelleEpice] = useState({ nom: '', prix_supplement: '' })
  const [nouvelInsert, setNouvelInsert] = useState({ nom: '', prix_supplement: '' })

  const [enEdition, setEnEdition] = useState(null)
  const [formEdition, setFormEdition] = useState({ nom: '', prix_supplement: '' })

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

  function ouvrirEdition(item) {
    setEnEdition(item.id)
    setFormEdition({ nom: item.nom, prix_supplement: item.prix_supplement })
  }

  function annulerEdition() {
    setEnEdition(null)
    setFormEdition({ nom: '', prix_supplement: '' })
  }

  async function enregistrerEdition(table, id) {
    await supabase.from(table).update({
      nom: formEdition.nom,
      prix_supplement: parseFloat(formEdition.prix_supplement) || 0,
    }).eq('id', id)
    setEnEdition(null)
    chargerDonnees()
  }

  async function supprimer(table, id) {
    if (!confirm('Supprimer définitivement cet élément ? Il sera retiré de tous les produits associés.')) return
    if (table === 'epices') await supabase.from('produit_epices').delete().eq('epice_id', id)
    if (table === 'inserts') await supabase.from('produit_inserts').delete().eq('insert_id', id)
    await supabase.from(table).delete().eq('id', id)
    chargerDonnees()
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* ÉPICES */}
      <div>
        <h2 className="text-lg font-medium mb-3" style={{ color: '#EDD98A' }}>🧂 Épices</h2>

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
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#F0B429', color: '#1E1912' }}>
            Ajouter
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {epices.map(epice => (
            <div key={epice.id} className="rounded-lg border overflow-hidden"
              style={{ background: '#2C2518', borderColor: enEdition === epice.id ? '#F0B429' : '#4A3820', opacity: epice.visible ? 1 : 0.5 }}>

              {enEdition === epice.id ? (
                <div className="flex items-center gap-2 p-2">
                  <input value={formEdition.nom} onChange={e => setFormEdition({ ...formEdition, nom: e.target.value })}
                    className="flex-1 px-2 py-1 rounded-md border text-sm outline-none" style={inputStyle} />
                  <input type="number" step="0.01" value={formEdition.prix_supplement}
                    onChange={e => setFormEdition({ ...formEdition, prix_supplement: e.target.value })}
                    className="w-20 px-2 py-1 rounded-md border text-sm outline-none" style={inputStyle} placeholder="+€" />
                  <button onClick={() => enregistrerEdition('epices', epice.id)}
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: '#F0B429', color: '#1E1912' }}>✓</button>
                  <button onClick={annulerEdition}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{epice.nom}</span>
                    <span className="text-xs ml-2" style={{ color: '#F0B429' }}>+{epice.prix_supplement} €</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => ouvrirEdition(epice)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                      Modifier
                    </button>
                    <button onClick={() => toggleVisibilite('epices', epice.id, epice.visible)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                      {epice.visible ? 'Cacher' : 'Afficher'}
                    </button>
                    <button onClick={() => supprimer('epices', epice.id)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                      Suppr.
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {epices.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucune épice pour l'instant.</p>}
        </div>
      </div>

      {/* INSERTS */}
      <div>
        <h2 className="text-lg font-medium mb-3" style={{ color: '#EDD98A' }}>🧀 Inserts</h2>

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
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: '#F0B429', color: '#1E1912' }}>
            Ajouter
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {inserts.map(insert => (
            <div key={insert.id} className="rounded-lg border overflow-hidden"
              style={{ background: '#2C2518', borderColor: enEdition === insert.id ? '#F0B429' : '#4A3820', opacity: insert.visible ? 1 : 0.5 }}>

              {enEdition === insert.id ? (
                <div className="flex items-center gap-2 p-2">
                  <input value={formEdition.nom} onChange={e => setFormEdition({ ...formEdition, nom: e.target.value })}
                    className="flex-1 px-2 py-1 rounded-md border text-sm outline-none" style={inputStyle} />
                  <input type="number" step="0.01" value={formEdition.prix_supplement}
                    onChange={e => setFormEdition({ ...formEdition, prix_supplement: e.target.value })}
                    className="w-20 px-2 py-1 rounded-md border text-sm outline-none" style={inputStyle} placeholder="+€" />
                  <button onClick={() => enregistrerEdition('inserts', insert.id)}
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: '#F0B429', color: '#1E1912' }}>✓</button>
                  <button onClick={annulerEdition}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{insert.nom}</span>
                    <span className="text-xs ml-2" style={{ color: '#F0B429' }}>+{insert.prix_supplement} €</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => ouvrirEdition(insert)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                      Modifier
                    </button>
                    <button onClick={() => toggleVisibilite('inserts', insert.id, insert.visible)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                      {insert.visible ? 'Cacher' : 'Afficher'}
                    </button>
                    <button onClick={() => supprimer('inserts', insert.id)}
                      className="text-xs px-2 py-1 rounded-md"
                      style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                      Suppr.
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {inserts.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucun insert pour l'instant.</p>}
        </div>
      </div>

    </div>
  )
}

export default AdminOptions
