import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [chargement, setChargement] = useState(true)
  const [nouvelleCategorie, setNouvelleCategorie] = useState({ nom: '', ordre: '' })

  useEffect(() => {
    chargerCategories()
  }, [])

  async function chargerCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('ordre', { nullsFirst: false })
    setCategories(data || [])
    setChargement(false)
  }

  async function ajouterCategorie(e) {
    e.preventDefault()
    if (!nouvelleCategorie.nom) return
    await supabase.from('categories').insert({
      nom: nouvelleCategorie.nom,
      ordre: parseInt(nouvelleCategorie.ordre) || null,
    })
    setNouvelleCategorie({ nom: '', ordre: '' })
    chargerCategories()
  }

  async function modifierOrdre(id, nouvelOrdre) {
    await supabase.from('categories').update({ ordre: parseInt(nouvelOrdre) || null }).eq('id', id)
    chargerCategories()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette catégorie ? Les produits associés ne seront pas supprimés mais perdront leur catégorie.')) return
    await supabase.from('categories').delete().eq('id', id)
    chargerCategories()
  }

  if (chargement) return <p style={{ color: '#7a4010' }}>Chargement...</p>

  const inputStyle = { borderColor: '#d6bfa0', background: '#fff', color: '#3d1e06' }

  return (
    <div>
      <h2 className="text-lg font-medium mb-3" style={{ color: '#3d1e06' }}>🏷️ Catégories</h2>

      <form onSubmit={ajouterCategorie} className="flex gap-2 mb-4 max-w-xl">
        <input
          placeholder="Nom (ex: Saucisson)"
          value={nouvelleCategorie.nom}
          onChange={e => setNouvelleCategorie({ ...nouvelleCategorie, nom: e.target.value })}
          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
        />
        <input
          placeholder="Ordre"
          type="number"
          value={nouvelleCategorie.ordre}
          onChange={e => setNouvelleCategorie({ ...nouvelleCategorie, ordre: e.target.value })}
          className="w-24 px-3 py-2 rounded-lg border text-sm outline-none"
          style={inputStyle}
        />
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#5a2e0e', color: '#fdf0d0' }}>
          Ajouter
        </button>
      </form>

      <div className="flex flex-col gap-2 max-w-xl">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between bg-white rounded-lg p-3 border"
            style={{ borderColor: '#d6bfa0' }}>
            <span className="text-sm font-medium" style={{ color: '#3d1e06' }}>{cat.nom}</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={cat.ordre ?? ''}
                onBlur={e => modifierOrdre(cat.id, e.target.value)}
                className="w-16 px-2 py-1 rounded-md border text-xs text-center outline-none"
                style={inputStyle}
                title="Ordre d'affichage"
              />
              <button onClick={() => supprimer(cat.id)}
                className="text-xs px-2 py-1 rounded-md"
                style={{ background: '#fde8e8', color: '#c0392b' }}>
                Suppr.
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm" style={{ color: '#a07050' }}>Aucune catégorie pour l'instant.</p>}
      </div>
    </div>
  )
}

export default AdminCategories