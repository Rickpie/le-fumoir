import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [chargement, setChargement] = useState(true)
  const [nouvelleCategorie, setNouvelleCategorie] = useState({ nom: '', ordre: '', delai_preparation: '', cout_preparation: '' })
  const [enEdition, setEnEdition] = useState(null)
  const [formEdition, setFormEdition] = useState({ nom: '', ordre: '', delai_preparation: '', cout_preparation: '' })

  useEffect(() => {
    chargerCategories()
  }, [])

  async function chargerCategories() {
    const { data } = await supabase.from('categories').select('*').order('ordre', { nullsFirst: false })
    setCategories(data || [])
    setChargement(false)
  }

  async function ajouterCategorie(e) {
    e.preventDefault()
    if (!nouvelleCategorie.nom) return
    await supabase.from('categories').insert({
      nom: nouvelleCategorie.nom,
      ordre: parseInt(nouvelleCategorie.ordre) || null,
      delai_preparation: nouvelleCategorie.delai_preparation || null,
      cout_preparation: parseFloat(nouvelleCategorie.cout_preparation) || 0,
    })
    setNouvelleCategorie({ nom: '', ordre: '', delai_preparation: '', cout_preparation: '' })
    chargerCategories()
  }

  function ouvrirEdition(cat) {
    setEnEdition(cat.id)
    setFormEdition({
      nom: cat.nom,
      ordre: cat.ordre ?? '',
      delai_preparation: cat.delai_preparation || '',
      cout_preparation: cat.cout_preparation ?? '',
    })
  }

  async function enregistrerEdition(id) {
    await supabase.from('categories').update({
      nom: formEdition.nom,
      ordre: parseInt(formEdition.ordre) || null,
      delai_preparation: formEdition.delai_preparation || null,
      cout_preparation: parseFloat(formEdition.cout_preparation) || 0,
    }).eq('id', id)
    setEnEdition(null)
    chargerCategories()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette catégorie ? Les produits associés ne seront pas supprimés mais perdront leur catégorie.')) return
    await supabase.from('categories').delete().eq('id', id)
    chargerCategories()
  }

  if (chargement) return <p style={{ color: '#FFFFFF' }}>Chargement...</p>

  const inputStyle = { borderColor: '#4A3820', background: '#1E1912', color: '#EDD98A' }
  const labelStyle = { color: '#FFFFFF' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-3" style={{ color: '#EDD98A' }}>🏷️ Catégories</h2>

      {/* Formulaire ajout */}
      <form onSubmit={ajouterCategorie} className="rounded-xl border p-4 mb-6 max-w-2xl flex flex-col gap-3"
        style={{ background: '#2C2518', borderColor: '#4A3820' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Nouvelle catégorie</p>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={labelStyle}>Nom *</label>
            <input placeholder="ex: Saucisson" value={nouvelleCategorie.nom}
              onChange={e => setNouvelleCategorie({ ...nouvelleCategorie, nom: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="w-20">
            <label className="block text-xs mb-1" style={labelStyle}>Ordre</label>
            <input type="number" placeholder="1" value={nouvelleCategorie.ordre}
              onChange={e => setNouvelleCategorie({ ...nouvelleCategorie, ordre: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs mb-1" style={labelStyle}>Délai de préparation</label>
            <input placeholder="ex: 4 à 8 semaines" value={nouvelleCategorie.delai_preparation}
              onChange={e => setNouvelleCategorie({ ...nouvelleCategorie, delai_preparation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div className="w-32">
            <label className="block text-xs mb-1" style={labelStyle}>Coût préparation (€)</label>
            <input type="number" step="0.01" placeholder="0.00" value={nouvelleCategorie.cout_preparation}
              onChange={e => setNouvelleCategorie({ ...nouvelleCategorie, cout_preparation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold self-start"
          style={{ background: '#F0B429', color: '#1E1912' }}>
          Ajouter
        </button>
      </form>

      {/* Liste */}
      <div className="flex flex-col gap-2 max-w-2xl">
        {categories.map(cat => (
          <div key={cat.id} className="rounded-xl border overflow-hidden"
            style={{ background: '#2C2518', borderColor: enEdition === cat.id ? '#F0B429' : '#4A3820' }}>

            {enEdition === cat.id ? (
              <div className="p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input value={formEdition.nom} onChange={e => setFormEdition({ ...formEdition, nom: e.target.value })}
                    placeholder="Nom" className="flex-1 px-2 py-1.5 rounded-md border text-sm outline-none" style={inputStyle} />
                  <input type="number" value={formEdition.ordre} onChange={e => setFormEdition({ ...formEdition, ordre: e.target.value })}
                    placeholder="Ordre" className="w-20 px-2 py-1.5 rounded-md border text-sm outline-none" style={inputStyle} />
                </div>
                <div className="flex gap-2">
                  <input value={formEdition.delai_preparation} onChange={e => setFormEdition({ ...formEdition, delai_preparation: e.target.value })}
                    placeholder="Délai (ex: 4 à 8 semaines)" className="flex-1 px-2 py-1.5 rounded-md border text-sm outline-none" style={inputStyle} />
                  <input type="number" step="0.01" value={formEdition.cout_preparation}
                    onChange={e => setFormEdition({ ...formEdition, cout_preparation: e.target.value })}
                    placeholder="Coût €" className="w-28 px-2 py-1.5 rounded-md border text-sm outline-none" style={inputStyle} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => enregistrerEdition(cat.id)}
                    className="text-xs px-3 py-1.5 rounded-md font-medium"
                    style={{ background: '#F0B429', color: '#1E1912' }}>
                    Enregistrer
                  </button>
                  <button onClick={() => setEnEdition(null)}
                    className="text-xs px-3 py-1.5 rounded-md"
                    style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3">
                <div>
                  <span className="text-sm font-medium" style={{ color: '#EDD98A' }}>{cat.nom}</span>
                  {cat.ordre != null && (
                    <span className="text-xs ml-2" style={{ color: '#FFFFFF' }}>#{cat.ordre}</span>
                  )}
                  <div className="flex gap-3 mt-0.5">
                    {cat.delai_preparation && (
                      <span className="text-xs" style={{ color: '#FFFFFF' }}>⏱ {cat.delai_preparation}</span>
                    )}
                    {cat.cout_preparation > 0 && (
                      <span className="text-xs" style={{ color: '#F0B429' }}>+{parseFloat(cat.cout_preparation).toFixed(2)} € (préparation)</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => ouvrirEdition(cat)}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ background: '#1E1912', color: '#FFFFFF', border: '1px solid #4A3820' }}>
                    Modifier
                  </button>
                  <button onClick={() => supprimer(cat.id)}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ background: 'rgba(176,58,46,0.15)', color: '#B03A2E', border: '1px solid rgba(176,58,46,0.3)' }}>
                    Suppr.
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm" style={{ color: '#FFFFFF' }}>Aucune catégorie pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminCategories
